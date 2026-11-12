import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries, TENANT_PLAN_WRITE_OUTCOME, type TTenantPlan } from '@blog/db';
import { isString } from '@blog/utils/primitives';
import { BILLING_LOG } from '@platform/constants/billing';
import { graceBillingFields } from '@platform/server/billing/grace-billing-fields';
import { planFromPriceKeys } from '@platform/server/billing/plan-from-price-keys';
import { resolveStripeTenant } from '@platform/server/billing/resolve-stripe-tenant';
import { stripeIdOf } from '@platform/server/billing/stripe-id';
import { tenantStateFromSubscription } from '@platform/server/billing/tenant-state-from-subscription';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

export type TSyncedSubscription = {
  tenantId: string;
  fromPlan: TTenantPlan;
  toPlan: TTenantPlan;
};

const SUBSCRIPTION_EXPAND = ['discounts.promotion_code'];

const promotionCodeOf = (
  subscription: Stripe.Subscription,
): TMaybeUndefined<string> =>
  subscription.discounts
    .map((discount) =>
      isString(discount) ? undefined : discount.promotion_code,
    )
    .map((code) => (code && !isString(code) ? code.code : undefined))
    .find(Boolean);

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

  const subscribed = planFromPriceKeys(
    subscription.items.data.map(({ price }) => price.lookup_key),
  );
  if (!subscribed) {
    logger.error(BILLING_LOG.PRICE_UNKNOWN, { tenantId, subscriptionId });
    return undefined;
  }

  const state = tenantStateFromSubscription(subscription.status, subscribed);
  if (!state) return undefined;

  const [tenant, billing] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.tenants.getTenantBilling(tenantId),
  ]);
  if (!tenant || !billing) return undefined;

  const { plan, status, subscriberBandCeiling, grace } = state;
  const write = await queries.tenants.setTenantPlan(tenantId, {
    plan,
    status,
  });
  if (write.outcome !== TENANT_PLAN_WRITE_OUTCOME.WRITTEN) {
    logger.warn(BILLING_LOG.TENANT_NOT_WRITABLE, {
      tenantId,
      subscriptionId,
      outcome: write.outcome,
    });
    return undefined;
  }

  const billingWrite = await queries.tenants.setTenantBilling(tenantId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePromotionCode:
      billing.stripePromotionCode ?? promotionCodeOf(subscription),
    subscriberBandCeiling,
    ...graceBillingFields(grace, billing, new Date()),
  });
  if (!billingWrite.ok) {
    throw new Error(
      `syncStripeSubscription: billing write for tenant "${tenantId}" failed with ${billingWrite.error}.`,
    );
  }

  return { tenantId, fromPlan: tenant.plan, toPlan: plan };
};
