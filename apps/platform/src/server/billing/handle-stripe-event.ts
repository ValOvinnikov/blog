import 'server-only';

import { handleCatalogueEvent } from '@platform/server/billing/catalogue/handle-catalogue-event';
import { revalidatePlatformSite } from '@platform/server/billing/catalogue/revalidate-platform-site';
import {
  ownerInvoiceEmailFor,
  type TOwnerInvoiceEmail,
} from '@platform/server/billing/owner-invoice-email';
import { releaseAppliedUpdateSchedule } from '@platform/server/billing/release-applied-update-schedule';
import { subscriptionIdFromEvent } from '@platform/server/billing/subscription-id-from-event';
import { syncStripeSubscription } from '@platform/server/billing/sync-stripe-subscription';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { queries, STRIPE_EVENT_RECORD_OUTCOME } from '@shinefold/db';
import { after } from 'next/server';
import type Stripe from 'stripe';

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
