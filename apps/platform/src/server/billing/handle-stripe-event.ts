import 'server-only';

import { queries, STRIPE_EVENT_RECORD_OUTCOME } from '@blog/db';
import { BILLING_LOG, STRIPE_EVENT_TYPE } from '@platform/constants/billing';
import { sendPaymentReceipt } from '@platform/server/billing/send-payment-receipt';
import { subscriptionIdFromEvent } from '@platform/server/billing/subscription-id-from-event';
import {
  syncStripeSubscription,
  type TSyncedSubscription,
} from '@platform/server/billing/sync-stripe-subscription';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { after } from 'next/server';
import type Stripe from 'stripe';

const runFollowUps = async (
  stripe: Stripe,
  event: Stripe.Event,
  { tenantId, fromPlan, toPlan }: TSyncedSubscription,
): Promise<void> => {
  if (fromPlan !== toPlan) {
    await onTenantPlanChange(tenantId, fromPlan, toPlan);
  }
  if (event.type !== STRIPE_EVENT_TYPE.INVOICE_PAID) return;
  try {
    await sendPaymentReceipt(stripe, event.data.object.id, tenantId, toPlan);
  } catch (error) {
    logger.error(BILLING_LOG.RECEIPT_FAILED, {
      tenantId,
      eventId: event.id,
      ...toLoggableError(error),
    });
  }
};

export const handleStripeEvent = async (
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> => {
  const subscriptionId = subscriptionIdFromEvent(event);
  if (!subscriptionId) return;

  const synced = await syncStripeSubscription(stripe, subscriptionId);
  const recorded = await queries.stripeWebhookEvents.recordStripeEvent(
    event.id,
  );
  if (recorded !== STRIPE_EVENT_RECORD_OUTCOME.RECORDED || !synced) return;

  after(() => runFollowUps(stripe, event, synced));
};
