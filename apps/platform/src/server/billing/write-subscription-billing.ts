import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { toBillingCurrency } from '@platform/server/billing/catalogue/to-catalogue-price';
import { graceBillingFields } from '@platform/server/billing/grace-billing-fields';
import type { TSubscribedPrices } from '@platform/server/billing/plan-from-price-keys';
import { stripeIdOf } from '@platform/server/billing/stripe-id';
import type {
  TSubscribedBilling,
  TSubscriptionTenantState,
} from '@platform/server/billing/tenant-state-from-subscription';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenantBilling } from '@shinefold/db/queries/tenants/tenant-billing';
import { isString } from '@shinefold/utils/primitives';
import type Stripe from 'stripe';

const promotionCodeOf = (
  subscription: Stripe.Subscription,
): TMaybeUndefined<string> =>
  subscription.discounts
    .map((discount) =>
      isString(discount) ? undefined : discount.promotion_code,
    )
    .map((code) => (code && !isString(code) ? code.code : undefined))
    .find(Boolean);

export const subscribedBillingOf = (
  { currency }: Stripe.Subscription,
  { interval, ...subscribed }: TSubscribedPrices,
): TSubscribedBilling => ({
  ...subscribed,
  billingInterval: interval,
  billingCurrency: toBillingCurrency(currency) ?? null,
});

export const writeSubscriptionBilling = async (
  subscription: Stripe.Subscription,
  tenantId: string,
  billing: TTenantBilling,
  {
    subscriberBandCeiling,
    billingInterval,
    billingCurrency,
    grace,
  }: TSubscriptionTenantState,
): Promise<void> => {
  const { id: subscriptionId, currency } = subscription;
  if (billingInterval && !billingCurrency) {
    logger.error(BILLING_LOG.CURRENCY_UNKNOWN, {
      tenantId,
      subscriptionId,
      currency,
    });
  }
  const write = await queries.tenants.setTenantBilling(tenantId, {
    stripeCustomerId: stripeIdOf(subscription.customer),
    stripeSubscriptionId: subscriptionId,
    stripePromotionCode:
      billing.stripePromotionCode ?? promotionCodeOf(subscription),
    subscriberBandCeiling,
    billingInterval,
    billingCurrency,
    ...graceBillingFields(grace, billing, new Date()),
  });
  if (!write.ok) {
    throw new Error(
      `writeSubscriptionBilling: billing write for tenant "${tenantId}" failed with ${write.error}.`,
    );
  }
};
