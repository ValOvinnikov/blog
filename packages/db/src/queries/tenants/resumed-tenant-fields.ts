import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { tenantPlanEnum } from '@blog/db/schema/tenant-plan-columns';
import { tenantStatusEnum } from '@blog/db/schema/tenant-status-columns';
import { tenants } from '@blog/db/schema/tenants';
import { type SQL, sql } from 'drizzle-orm';

const isUnpaidTrial = sql`(${tenants.trialEndsAt} is not null and ${tenants.stripeSubscriptionId} is null)`;
const statusType = sql.raw(tenantStatusEnum.enumName);
const planType = sql.raw(tenantPlanEnum.enumName);

type TResumedTenantFieldsInput = {
  isResuming: SQL;
};

// A resumed tenant gets back the status it had before its hold (a held row without one resumes as a trial when unpaid); a trial past its end is left to the daily sweep to end.
export function resumedTenantFields({ isResuming }: TResumedTenantFieldsInput) {
  const resumedStatus = sql`coalesce(${tenants.statusBeforeHold}, (case when ${isUnpaidTrial} then ${TENANT_STATUS.TRIAL} else ${TENANT_STATUS.ACTIVE} end)::${statusType})`;

  return {
    status: sql`case when ${isResuming} then ${resumedStatus} else ${tenants.status} end`,
    statusBeforeHold: sql`case when ${isResuming} then null else ${tenants.statusBeforeHold} end`,
    selfServeOwnerEmailIndex: sql`case when ${isResuming} and ${tenants.plan} <> ${TENANT_PLAN.FREE}::${planType} and not ${isUnpaidTrial} then null else ${tenants.selfServeOwnerEmailIndex} end`,
  };
}
