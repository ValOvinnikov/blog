import {
  BILLING_GRACE,
  STRIPE_SUBSCRIPTION_STATUS,
  type TBillingGrace,
} from '@platform/constants/billing';
import type { TSubscribedPlan } from '@platform/server/billing/plan-from-price-keys';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  TENANT_PLAN,
  type TBillingInterval,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  TENANT_STATUS,
  type TBillingCurrency,
  type TTenantStatus,
} from '@shinefold/db/constants';

export type TSubscribedBilling = TSubscribedPlan & {
  billingInterval: TMaybeNull<TBillingInterval>;
  billingCurrency: TMaybeNull<TBillingCurrency>;
};

export type TSubscriptionTenantState = TSubscribedBilling & {
  status: TTenantStatus;
  grace: TBillingGrace;
};

export const tenantStateFromSubscription = (
  subscriptionStatus: string,
  subscribed: TSubscribedBilling,
  currentPlan: TTenantPlan,
): TMaybeUndefined<TSubscriptionTenantState> => {
  switch (subscriptionStatus) {
    case STRIPE_SUBSCRIPTION_STATUS.ACTIVE:
    case STRIPE_SUBSCRIPTION_STATUS.TRIALING:
      return {
        ...subscribed,
        status: TENANT_STATUS.ACTIVE,
        grace: BILLING_GRACE.END,
      };
    case STRIPE_SUBSCRIPTION_STATUS.PAST_DUE:
      return {
        ...subscribed,
        status: TENANT_STATUS.PAST_DUE,
        grace: BILLING_GRACE.KEEP,
      };
    case STRIPE_SUBSCRIPTION_STATUS.CANCELED:
    case STRIPE_SUBSCRIPTION_STATUS.UNPAID:
      return {
        plan: TENANT_PLAN.FREE,
        subscriberBandCeiling: null,
        billingInterval: null,
        billingCurrency: null,
        status: TENANT_STATUS.ACTIVE,
        grace:
          currentPlan === TENANT_PLAN.FREE
            ? BILLING_GRACE.KEEP
            : BILLING_GRACE.START,
      };
    default:
      return undefined;
  }
};
