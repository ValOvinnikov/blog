import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import { tenants } from '@blog/db/schema/tenants';

export type TTenantBilling = {
  stripeCustomerId: TMaybeUndefined<string>;
  stripeSubscriptionId: TMaybeUndefined<string>;
  stripePromotionCode: TMaybeUndefined<string>;
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
  trialEndsAt: tenants.trialEndsAt,
  downgradeGraceStartedAt: tenants.downgradeGraceStartedAt,
  graceStartedEmailSentAt: tenants.graceStartedEmailSentAt,
  graceHalfwayEmailSentAt: tenants.graceHalfwayEmailSentAt,
  graceEndingEmailSentAt: tenants.graceEndingEmailSentAt,
};

type TTenantBillingRow = {
  [K in keyof TTenantBilling]: TMaybeNull<
    Exclude<TTenantBilling[K], undefined>
  >;
};

export function toTenantBilling(row: TTenantBillingRow): TTenantBilling {
  return {
    stripeCustomerId: row.stripeCustomerId ?? undefined,
    stripeSubscriptionId: row.stripeSubscriptionId ?? undefined,
    stripePromotionCode: row.stripePromotionCode ?? undefined,
    trialEndsAt: row.trialEndsAt ?? undefined,
    downgradeGraceStartedAt: row.downgradeGraceStartedAt ?? undefined,
    graceStartedEmailSentAt: row.graceStartedEmailSentAt ?? undefined,
    graceHalfwayEmailSentAt: row.graceHalfwayEmailSentAt ?? undefined,
    graceEndingEmailSentAt: row.graceEndingEmailSentAt ?? undefined,
  };
}
