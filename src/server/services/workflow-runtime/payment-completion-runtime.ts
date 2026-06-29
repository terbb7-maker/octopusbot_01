import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { DeliveryRuntime } from "@/server/services/workflow-runtime/delivery-runtime";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { OrderBumpExecutor } from "@/server/services/workflow-runtime/order-bump-executor";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";
import { UpsellExecutor } from "@/server/services/workflow-runtime/upsell-executor";

export class PaymentCompletionRuntime {
  private readonly checkout: CheckoutRuntime;
  private readonly conversation: ConversationRuntime;
  private readonly delivery: DeliveryRuntime;
  private readonly events: EventLogger;
  private readonly orderBump = new OrderBumpExecutor();
  private readonly plans = new PlanExecutor();
  private readonly upsell: UpsellExecutor;

  constructor(supabase: RuntimeSupabase) {
    this.checkout = new CheckoutRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.delivery = new DeliveryRuntime(supabase);
    this.events = new EventLogger(supabase);
    this.upsell = new UpsellExecutor(supabase);
  }

  async finishPaidCheckout(input: {
    checkout: RuntimeCheckout;
    config: RuntimeConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const plan = this.plans.findPlan(input.config, input.checkout.plan_id);
    if (!plan) return;

    await this.checkout.markPaid(input.checkout);
    await this.events.log(input.session, "pix_paid", {
      checkoutId: input.checkout.id,
      paymentId: input.checkout.payment_id,
    });
    await this.conversation.updateSession(input.session, {
      conversation_status: "paid",
      current_step: "delivery",
      payment_status: "approved",
    });

    await this.delivery.executePaymentApproved(input);
    await this.delivery.executeMainDelivery({ ...input, plan });

    if (input.checkout.order_bump_id) {
      const offer = this.orderBump.findOffer(input.config, plan);
      await this.delivery.executeNamedDelivery({
        config: input.config,
        deliveryId: offer?.deliveryId,
        resolver: input.resolver,
        session: input.session,
      });
    }

    await this.upsell.execute(input);
    await this.events.log(input.session, "conversation_finished", {
      checkoutId: input.checkout.id,
    });
    await this.conversation.updateSession(input.session, {
      conversation_status: "completed",
      current_step: "finished",
      ended_at: new Date().toISOString(),
      status: "completed",
    });
  }
}
