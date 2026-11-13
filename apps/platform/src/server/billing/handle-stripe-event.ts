import 'server-only';

import type { TTenantPlan } from '@blog/config/constants';
import { queries, STRIPE_EVENT_RECORD_OUTCOME } from '@blog/db';
import { BILLING_LOG, STRIPE_EVENT_TYPE } from '@platform/constants/billing';
import { sendPaymentReceipt } from '@platform/server/billing/send-payment-receipt';
import { subscriptionIdFromEvent } from '@platform/server/billing/subscription-id-from-event';
import { syncStripeSubscription } from '@platform/server/billing/sync-stripe-subscription';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { after } from 'next/server';
import type Stripe from 'stripe';

const sendReceiptOrLog = async (
  stripe: Stripe,
  event: Stripe.InvoicePaidEvent,
  tenantId: string,
  plan: TTenantPlan,
): Promise<void> => {
  try {
    await sendPaymentReceipt(stripe, event.data.object.id, tenantId, plan);
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
  if (synced && synced.fromPlan !== synced.toPlan) {
    const { tenantId, fromPlan, toPlan } = synced;
    after(() => onTenantPlanChange(tenantId, fromPlan, toPlan));
  }

  const recorded = await queries.stripeWebhookEvents.recordStripeEvent(
    event.id,
  );
  if (
    synced &&
    recorded === STRIPE_EVENT_RECORD_OUTCOME.RECORDED &&
    event.type === STRIPE_EVENT_TYPE.INVOICE_PAID
  ) {
    const { tenantId, toPlan } = synced;
    after(() => sendReceiptOrLog(stripe, event, tenantId, toPlan));
  }
};
