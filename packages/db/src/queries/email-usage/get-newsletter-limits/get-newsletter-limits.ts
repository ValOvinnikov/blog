import {
  CAPABILITY,
  EMAIL_TYPE,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  PLAN_MONTHLY_SENDS_PER_SUBSCRIBER,
  SUBSCRIBER_BAND_CEILINGS,
} from '@shinefold/db/constants';
import { countEmailSendsThisMonth } from '@shinefold/db/queries/email-usage/count-email-sends-this-month';
import { countActiveSubscribers } from '@shinefold/db/queries/subscribers/count-active-subscribers';
import { listResolvableEntitlementGrants } from '@shinefold/db/queries/tenant-entitlement-grants/list-resolvable-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';
import { resolveTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TNewsletterLimits = {
  activeCount: number;
  bandCeiling: number;
  allowance: number;
  sentThisMonth: number;
};

type TNewsletterLimitsTenant = Pick<
  TTenant,
  'id' | 'plan' | 'subscriberBandCeiling'
>;

async function allowancePlan({
  id,
  plan,
}: TNewsletterLimitsTenant): Promise<TTenantPlan> {
  if (PLAN_MONTHLY_SENDS_PER_SUBSCRIBER[plan] > 0) return plan;

  const grants = await listResolvableEntitlementGrants(id);
  const { capabilities } = resolveTenantEntitlements(plan, grants, new Date());
  return capabilities.includes(CAPABILITY.NEWSLETTER)
    ? TENANT_PLAN.GROWTH
    : plan;
}

export async function getNewsletterLimits(
  tenant: TNewsletterLimitsTenant,
): Promise<TNewsletterLimits> {
  const { id, subscriberBandCeiling } = tenant;
  const bandCeiling = subscriberBandCeiling ?? SUBSCRIBER_BAND_CEILINGS[0];
  const [activeCount, sentThisMonth, plan] = await Promise.all([
    countActiveSubscribers(id),
    countEmailSendsThisMonth(id, EMAIL_TYPE.NEWSLETTER_ISSUE),
    allowancePlan(tenant),
  ]);

  return {
    activeCount,
    bandCeiling,
    allowance: monthlySendAllowance(plan, bandCeiling),
    sentThisMonth,
  };
}
