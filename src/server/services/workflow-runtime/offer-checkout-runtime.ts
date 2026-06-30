import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { OrderBumpExecutor } from "@/server/services/workflow-runtime/order-bump-executor";
import { PaymentRuntime } from "@/server/services/workflow-runtime/payment-runtime";
import { PaymentCompletionRuntime } from "@/server/services/workflow-runtime/payment-completion-runtime";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import type {
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

export class OfferCheckoutRuntime {
  private readonly checkout: CheckoutRuntime;
  private readonly conversation: ConversationRuntime;
  private readonly events: EventLogger;
  private readonly orderBump = new OrderBumpExecutor();
  private readonly payment: PaymentRuntime;
  private readonly paymentCompletion: PaymentCompletionRuntime;
  private readonly plans = new PlanExecutor();

  constructor(supabase: RuntimeSupabase) {
    this.checkout = new CheckoutRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.events = new EventLogger(supabase);
    this.payment = new PaymentRuntime(supabase);
    this.paymentCompletion = new PaymentCompletionRuntime(supabase);
  }

  async handle(input: {
    config: RuntimeConfig;
    data: string;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const [kind, sequenceId, planId] = input.data.split(":");
    const plan = this.plans.findAnyPlan(input.config, planId);
    if (!plan) return { message: "Plano nao encontrado.", ok: false };
    const sequence =
      kind === "upsell"
        ? input.config.graph.upsells.find((item) => item.id === sequenceId)
        : input.config.graph.downsells.find((item) => item.id === sequenceId);

    const checkout = await this.checkout.createDraft({
      config: input.config,
      downsellId: kind === "downsell" ? sequenceId : null,
      planId,
      session: input.session,
      subtotalCents: plan.priceCents,
      upsellId: kind === "upsell" ? sequenceId : null,
    });

    await this.conversation.updateSession(input.session, {
      current_offer: sequenceId,
      current_step: kind,
      selected_downsell_id: kind === "downsell" ? sequenceId : null,
      selected_upsell_id: kind === "upsell" ? sequenceId : null,
    });
    await this.events.log(input.session, "checkout_created", {
      checkoutId: checkout.id,
      kind,
      planId,
      sequenceId,
    });

    const offer =
      sequence?.orderBumpMode === "exclusive"
        ? sequence.orderBump
        : sequence?.orderBumpMode === "global"
          ? this.orderBump.findOffer(input.config, plan)
          : null;

    if (offer?.enabled) {
      await this.events.log(input.session, "order_bump_shown", {
        checkoutId: checkout.id,
        kind,
        planId,
        sequenceId,
      });
      await this.orderBump.sendOffer({
        checkout,
        config: input.config,
        offer,
        resolver: input.resolver,
        session: input.session,
      });
      return { ok: true };
    }

    const result = await this.payment.createPixAndSend({
      checkout,
      config: input.config,
      resolver: input.resolver,
      session: input.session,
    });

    await this.events.log(input.session, "pix_created", {
      checkoutId: result.checkout.id,
      paymentId: result.checkout.payment_id,
      totalCents: result.checkout.total_cents,
    });

    if (result.status === "approved") {
      await this.paymentCompletion.finishPaidCheckout({
        checkout: result.checkout,
        config: input.config,
        resolver: input.resolver,
        session: input.session,
      });
    }

    return { ok: true };
  }
}
