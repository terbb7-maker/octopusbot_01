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
    const isOfferCheckout = Boolean(
      input.checkout.upsell_id || input.checkout.downsell_id,
    );
    const plan = isOfferCheckout
      ? this.plans.findAnyPlan(input.config, input.checkout.plan_id)
      : this.plans.findPlan(input.config, input.checkout.plan_id);
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

    const upsell = input.checkout.upsell_id
      ? input.config.graph.upsells.find((item) => item.id === input.checkout.upsell_id)
      : null;
    if (upsell) {
      const exclusivePlan = upsell.exclusivePlans.find(
        (item) => item.id === input.checkout.plan_id,
      );
      const orderBumpOffer =
        upsell.orderBumpMode === "exclusive"
          ? upsell.orderBump
          : this.orderBump.findOffer(input.config, plan);

      await this.delivery.executeSequenceDelivery({
        config: input.config,
        deliveryConfig: {
          linkUrl:
            upsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.linkUrl
              : upsell.deliveryConfig?.linkUrl,
          message:
            upsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.message
              : upsell.deliveryConfig?.message,
          telegramDestinationId:
            upsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.telegramDestinationId
              : upsell.deliveryConfig?.telegramDestinationId,
          type:
            upsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryType ?? "custom_message"
              : upsell.deliveryType,
        },
        resolver: input.resolver,
        session: input.session,
        sequenceId: upsell.id,
      });
      if (input.checkout.order_bump_id) {
        await this.delivery.executeOrderBumpDelivery({
          config: input.config,
          offer: orderBumpOffer,
          resolver: input.resolver,
          session: input.session,
        });
      }
      await this.events.log(input.session, "upsell_paid", {
        checkoutId: input.checkout.id,
        upsellId: upsell.id,
      });
      return;
    }

    const downsell = input.checkout.downsell_id
      ? input.config.graph.downsells.find(
          (item) => item.id === input.checkout.downsell_id,
        )
      : null;
    if (downsell) {
      const exclusivePlan = downsell.exclusivePlans.find(
        (item) => item.id === input.checkout.plan_id,
      );
      const orderBumpOffer =
        downsell.orderBumpMode === "exclusive"
          ? downsell.orderBump
          : this.orderBump.findOffer(input.config, plan);

      await this.delivery.executeSequenceDelivery({
        config: input.config,
        deliveryConfig: {
          linkUrl:
            downsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.linkUrl
              : downsell.deliveryConfig?.linkUrl,
          message:
            downsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.message
              : downsell.deliveryConfig?.message,
          telegramDestinationId:
            downsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryConfig.telegramDestinationId
              : downsell.deliveryConfig?.telegramDestinationId,
          type:
            downsell.deliveryType === "exclusive_plans"
              ? exclusivePlan?.deliveryType ?? "custom_message"
              : downsell.deliveryType,
        },
        resolver: input.resolver,
        session: input.session,
        sequenceId: downsell.id,
      });
      if (input.checkout.order_bump_id) {
        await this.delivery.executeOrderBumpDelivery({
          config: input.config,
          offer: orderBumpOffer,
          resolver: input.resolver,
          session: input.session,
        });
      }
      await this.events.log(input.session, "downsell_paid", {
        checkoutId: input.checkout.id,
        downsellId: downsell.id,
      });
      return;
    }

    await this.delivery.executeMainDelivery({ ...input, plan });

    if (input.checkout.order_bump_id) {
      const offer = this.orderBump.findOffer(input.config, plan);
      await this.delivery.executeOrderBumpDelivery({
        config: input.config,
        offer,
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
