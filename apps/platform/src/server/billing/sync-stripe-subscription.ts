import 'server-only';

import {
  BILLING_LOG,
  STRIPE_LIVE_SUBSCRIPTION_STATUSES,
} from '@platform/constants/billing';
import { pricesFromKeys } from '@platform/server/billing/plan-from-price-keys';
import { releaseSchedule } from '@platform/server/billing/release-schedule';
import { resolveStripeTenant } from '@platform/server/billing/resolve-stripe-tenant';
import { stripeIdOf } from '@platform/server/billing/stripe-id';
import { subscriptionEndsAt } from '@platform/server/billing/subscription-ends-at';
import { tenantStateFromSubscription } from '@platform/server/billing/tenant-state-from-subscription';
import {
  subscribedBillingOf,
  writeSubscriptionBilling,
} from '@platform/server/billing/write-subscription-billing';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import {
  queries,
  TENANT_PLAN_WRITE_OUTCOME,
  TENANT_STATUS,
  WRITABLE_TENANT_STATUSES,
} from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';
import type Stripe from 'stripe';

export type TSyncedSubscription = {
  tenantId: string;
  fromPlan: TTenantPlan;
  toPlan: TTenantPlan;
};

const SUBSCRIPTION_EXPAND = ['discounts.promotion_code'];

// Suspending a paying site pauses its collection, and Stripe echoes that pause back here.
const isSuspensionPauseEcho = (
  { status }: Pick<TTenant, 'status'>,
  subscription: Stripe.Subscription,
): boolean =>
  status === TENANT_STATUS.SUSPENDED &&
  !!subscription.pause_collection &&
  isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, subscription.status);

const isSupersededBy = (
  storedSubscriptionId: TMaybeUndefined<string>,
  { id, status }: Stripe.Subscription,
): boolean =>
  !!storedSubscriptionId &&
  storedSubscriptionId !== id &&
  !isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status);

export const syncStripeSubscription = async (
  stripe: Stripe,
  subscriptionId: string,
): Promise<TMaybeUndefined<TSyncedSubscription>> => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: SUBSCRIPTION_EXPAND,
  });
  const customerId = stripeIdOf(subscription.customer);
  const tenantId = await resolveStripeTenant(subscription, customerId);
  if (!tenantId) return undefined;

  const prices = pricesFromKeys(
    subscription.items.data.map(({ price }) => price.lookup_key),
  );
  if (!prices) {
    logger.error(BILLING_LOG.PRICE_UNKNOWN, { tenantId, subscriptionId });
    return undefined;
  }

  const [tenant, billing] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.tenants.getTenantBilling(tenantId),
  ]);
  if (!tenant || !billing) return undefined;

  if (isSupersededBy(billing.stripeSubscriptionId, subscription)) {
    logger.warn(BILLING_LOG.SUBSCRIPTION_SUPERSEDED, {
      tenantId,
      subscriptionId,
      storedSubscriptionId: billing.stripeSubscriptionId,
    });
    return undefined;
  }

  if (subscription.schedule && subscriptionEndsAt(subscription)) {
    await releaseSchedule(stripe, stripeIdOf(subscription.schedule));
  }

  const state = tenantStateFromSubscription(
    subscription.status,
    subscribedBillingOf(subscription, prices),
    tenant.plan,
  );
  if (!state) return undefined;

  const notWritable = { tenantId, subscriptionId, status: tenant.status };
  if (!isOneOf(WRITABLE_TENANT_STATUSES, tenant.status)) {
    if (!isSuspensionPauseEcho(tenant, subscription)) {
      logger.warn(BILLING_LOG.TENANT_NOT_WRITABLE, notWritable);
    }
    return undefined;
  }

  await writeSubscriptionBilling(subscription, tenantId, billing, state);

  const { plan, status } = state;
  const write = await queries.tenants.setTenantPlan(tenantId, {
    plan,
    status,
  });
  if (write.outcome !== TENANT_PLAN_WRITE_OUTCOME.WRITTEN) {
    logger.warn(BILLING_LOG.TENANT_NOT_WRITABLE, notWritable);
    return undefined;
  }

  return { tenantId, fromPlan: write.previousPlan, toPlan: write.plan };
};
