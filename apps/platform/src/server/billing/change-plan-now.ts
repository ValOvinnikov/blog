import 'server-only';

import {
  BILLING_LOG,
  STRIPE_PRORATION_BEHAVIOR,
} from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
} from '@platform/constants/plan-change';
import {
  STRIPE_PAYMENT_BEHAVIOR,
  STRIPE_PAYMENT_GOING_THROUGH,
  STRIPE_PAYMENT_INTENT_STATUS,
  STRIPE_PENDING_PAYMENT_EXPAND,
} from '@platform/constants/stripe-payment';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import { isOneOf, isString } from '@shinefold/utils/primitives';
import type Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import { releaseSchedule } from './release-schedule';
import type { TTargetPrices } from './schedule-change-at-renewal';
import { stripeIdOf } from './stripe-id';
import { subscriptionItemsFor } from './subscription-items';

type TPaymentConfirmation = { clientSecret: string };

export type TChangeNowResult =
  | typeof PLAN_CHANGE_TIMING.NOW
  | typeof PLAN_CHANGE_REFUSAL.CARD_DECLINED
  | TPaymentConfirmation
  | undefined;

const updateItems = (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  prices: TTargetPrices,
) =>
  stripe.subscriptions.update(subscription.id, {
    items: subscriptionItemsFor(subscription, prices),
    proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
    payment_behavior: STRIPE_PAYMENT_BEHAVIOR.PENDING_IF_INCOMPLETE,
    expand: STRIPE_PENDING_PAYMENT_EXPAND,
  });

const releaseAfterChange = (
  stripe: Stripe,
  scheduleId: string,
  tenantId: string,
): Promise<void> =>
  releaseSchedule(stripe, scheduleId)
    .catch(() => releaseSchedule(stripe, scheduleId))
    .catch((error: unknown) => {
      logger.error(BILLING_LOG.PLAN_CHANGE_RELEASE_FAILED, {
        tenantId,
        scheduleId,
        ...toLoggableError(error),
      });
    });

const paymentIntentStatus = async (
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<TMaybeUndefined<Stripe.PaymentIntent.Status>> => {
  const paymentIntent = invoice.payments?.data.find(
    ({ payment }) => payment.payment_intent,
  )?.payment.payment_intent;
  if (!paymentIntent) return undefined;
  const { status } = await stripe.paymentIntents.retrieve(
    stripeIdOf(paymentIntent),
  );
  return status;
};

const pendingPaymentResult = async (
  stripe: Stripe,
  invoice: TMaybeUndefined<Stripe.Invoice>,
  tenantId: string,
): Promise<TChangeNowResult> => {
  const status = invoice && (await paymentIntentStatus(stripe, invoice));
  const clientSecret = invoice?.confirmation_secret?.client_secret;
  if (status && isOneOf(STRIPE_PAYMENT_GOING_THROUGH, status)) {
    return PLAN_CHANGE_TIMING.NOW;
  }
  if (status === STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION && clientSecret) {
    return { clientSecret };
  }
  if (status === STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD) {
    return PLAN_CHANGE_REFUSAL.CARD_DECLINED;
  }
  logger.error(BILLING_LOG.PLAN_CHANGE_PAYMENT_UNKNOWN, {
    tenantId,
    invoiceId: invoice?.id,
    status,
  });
  return undefined;
};

export const changePlanNow = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  prices: TTargetPrices,
  tenantId: string,
): Promise<TChangeNowResult> => {
  const { pending_update, latest_invoice, schedule } = await updateItems(
    stripe,
    subscription,
    prices,
  );
  if (pending_update) {
    const invoice =
      latest_invoice && !isString(latest_invoice) ? latest_invoice : undefined;
    return pendingPaymentResult(stripe, invoice, tenantId);
  }
  if (schedule)
    await releaseAfterChange(stripe, stripeIdOf(schedule), tenantId);
  return PLAN_CHANGE_TIMING.NOW;
};
