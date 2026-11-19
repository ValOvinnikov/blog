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
import { countEmailSendsThisMonth } from '@shinefold/db/queries/email-usage';
import { countActiveSubscribers } from '@shinefold/db/queries/subscribers';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';
import type { TNewsletterLimits } from '@worker/utils/newsletter-send/newsletter-limits';
import { readTenantEntitlements } from '@worker/utils/tenant-entitlements/read-tenant-entitlements';

async function allowancePlan(tenant: TTenant): Promise<TTenantPlan> {
  const { plan } = tenant;
  if (PLAN_MONTHLY_SENDS_PER_SUBSCRIBER[plan] > 0) return plan;

  const { capabilities } = await readTenantEntitlements(tenant);
  return capabilities.includes(CAPABILITY.NEWSLETTER)
    ? TENANT_PLAN.GROWTH
    : plan;
}

export async function readNewsletterLimits(
  tenant: TTenant,
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
