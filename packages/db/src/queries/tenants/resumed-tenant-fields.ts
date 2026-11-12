import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import {
  tenantPlanEnum,
  tenants,
  tenantStatusEnum,
} from '@blog/db/schema/tenants';
import { type SQL, sql } from 'drizzle-orm';

const isUnpaidTrial = sql`(${tenants.trialEndsAt} is not null and ${tenants.stripeSubscriptionId} is null)`;
const hasTrialEnded = sql`${tenants.trialEndsAt} <= now()`;
const statusType = sql.raw(tenantStatusEnum.enumName);
const planType = sql.raw(tenantPlanEnum.enumName);

// A trial resumes as a trial (Free once it has ended) and a paid site gives up the Free-or-trial slot; rows where `isResuming` is false keep every field.
export function resumedTenantFields(isResuming: SQL = sql`true`) {
  return {
    status: sql`case when ${isResuming} then (case when ${isUnpaidTrial} and not ${hasTrialEnded} then ${TENANT_STATUS.TRIAL} else ${TENANT_STATUS.ACTIVE} end)::${statusType} else ${tenants.status} end`,
    plan: sql`case when ${isResuming} and ${isUnpaidTrial} and ${hasTrialEnded} then ${TENANT_PLAN.FREE}::${planType} else ${tenants.plan} end`,
    selfServeOwnerEmailIndex: sql`case when ${isResuming} and ${tenants.plan} <> ${TENANT_PLAN.FREE}::${planType} and not ${isUnpaidTrial} then null else ${tenants.selfServeOwnerEmailIndex} end`,
  };
}
