import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import { STRIPE_BILLING_REASON } from '@platform/constants/stripe-payment';
import { handleCatalogueEvent } from '@platform/server/billing/catalogue/handle-catalogue-event';
import { revalidatePlatformSite } from '@platform/server/billing/catalogue/revalidate-platform-site';
import { releaseAppliedUpdateSchedule } from '@platform/server/billing/release-applied-update-schedule';
import { sendPaymentFailedNotice } from '@platform/server/billing/send-payment-failed-notice';
import { sendPaymentReceipt } from '@platform/server/billing/send-payment-receipt';
import { subscriptionIdFromEvent } from '@platform/server/billing/subscription-id-from-event';
import {
  syncStripeSubscription,
  type TSyncedSubscription,
} from '@platform/server/billing/sync-stripe-subscription';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import { queries, STRIPE_EVENT_RECORD_OUTCOME } from '@shinefold/db';
import { after } from 'next/server';
import type Stripe from 'stripe';

type TOwnerInvoiceEmail = {
  send: () => Promise<void>;
  failedLog: TValueOf<typeof BILLING_LOG>;
};

const ownerInvoiceEmailFor = (
  stripe: Stripe,
  event: Stripe.Event,
  { tenantId, toPlan }: TSyncedSubscription,
): TMaybeUndefined<TOwnerInvoiceEmail> => {
  if (event.type === STRIPE_EVENT_TYPE.INVOICE_PAID) {
    const invoiceId = event.data.object.id;
    return {
      send: () => sendPaymentReceipt(stripe, invoiceId, tenantId, toPlan),
      failedLog: BILLING_LOG.RECEIPT_FAILED,
    };
  }
  if (
    event.type === STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED &&
    event.data.object.attempt_count === 1 &&
    event.data.object.billing_reason ===
      STRIPE_BILLING_REASON.SUBSCRIPTION_CYCLE
  ) {
    const invoice = event.data.object;
    return {
      send: () => sendPaymentFailedNotice(invoice, tenantId, toPlan),
      failedLog: BILLING_LOG.PAYMENT_FAILED_EMAIL_FAILED,
    };
  }
  return undefined;
};

const sendOrLog = async (
  { send, failedLog }: TOwnerInvoiceEmail,
  eventId: string,
  tenantId: string,
): Promise<void> => {
  try {
    await send();
  } catch (error) {
    logger.error(failedLog, { tenantId, eventId, ...toLoggableError(error) });
  }
};

export const handleStripeEvent = async (
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> => {
  if (await handleCatalogueEvent(stripe, event)) {
    after(revalidatePlatformSite);
    return;
  }

  const subscriptionId = subscriptionIdFromEvent(event);
  if (!subscriptionId) return;

  const synced = await syncStripeSubscription(stripe, subscriptionId);
  await releaseAppliedUpdateSchedule(stripe, event);
  if (synced && synced.fromPlan !== synced.toPlan) {
    const { tenantId, fromPlan, toPlan } = synced;
    after(() => revalidateSiteConfig(tenantId));
    after(() => onTenantPlanChange(tenantId, fromPlan, toPlan));
  }

  const recorded = await queries.stripeWebhookEvents.recordStripeEvent(
    event.id,
  );
  if (!synced || recorded !== STRIPE_EVENT_RECORD_OUTCOME.RECORDED) return;

  const email = ownerInvoiceEmailFor(stripe, event, synced);
  if (email) after(() => sendOrLog(email, event.id, synced.tenantId));
};
