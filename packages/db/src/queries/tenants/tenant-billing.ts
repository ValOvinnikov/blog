import type { TBillingInterval } from '@shinefold/config/constants';
import type { TMaybeUndefined, TNullableRow } from '@shinefold/config/types';
import type {
  TBillingCurrency,
  TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import { tenants } from '@shinefold/db/schema/tenants';

export type TTenantBilling = {
  stripeCustomerId: TMaybeUndefined<string>;
  stripeSubscriptionId: TMaybeUndefined<string>;
  stripePromotionCode: TMaybeUndefined<string>;
  subscriberBandCeiling: TMaybeUndefined<TPaidSubscriberBandCeiling>;
  billingInterval: TMaybeUndefined<TBillingInterval>;
  billingCurrency: TMaybeUndefined<TBillingCurrency>;
  trialEndsAt: TMaybeUndefined<Date>;
  downgradeGraceStartedAt: TMaybeUndefined<Date>;
  graceStartedEmailSentAt: TMaybeUndefined<Date>;
  graceHalfwayEmailSentAt: TMaybeUndefined<Date>;
  graceEndingEmailSentAt: TMaybeUndefined<Date>;
};

export const tenantBillingColumns = {
  stripeCustomerId: tenants.stripeCustomerId,
  stripeSubscriptionId: tenants.stripeSubscriptionId,
  stripePromotionCode: tenants.stripePromotionCode,
  subscriberBandCeiling: tenants.subscriberBandCeiling,
  billingInterval: tenants.billingInterval,
  billingCurrency: tenants.billingCurrency,
  trialEndsAt: tenants.trialEndsAt,
  downgradeGraceStartedAt: tenants.downgradeGraceStartedAt,
  graceStartedEmailSentAt: tenants.graceStartedEmailSentAt,
  graceHalfwayEmailSentAt: tenants.graceHalfwayEmailSentAt,
  graceEndingEmailSentAt: tenants.graceEndingEmailSentAt,
};

export function toTenantBilling(
  row: TNullableRow<TTenantBilling>,
): TTenantBilling {
  return {
    stripeCustomerId: row.stripeCustomerId ?? undefined,
    stripeSubscriptionId: row.stripeSubscriptionId ?? undefined,
    stripePromotionCode: row.stripePromotionCode ?? undefined,
    subscriberBandCeiling: row.subscriberBandCeiling ?? undefined,
    billingInterval: row.billingInterval ?? undefined,
    billingCurrency: row.billingCurrency ?? undefined,
    trialEndsAt: row.trialEndsAt ?? undefined,
    downgradeGraceStartedAt: row.downgradeGraceStartedAt ?? undefined,
    graceStartedEmailSentAt: row.graceStartedEmailSentAt ?? undefined,
    graceHalfwayEmailSentAt: row.graceHalfwayEmailSentAt ?? undefined,
    graceEndingEmailSentAt: row.graceEndingEmailSentAt ?? undefined,
  };
}
