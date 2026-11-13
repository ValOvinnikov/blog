import type { TMaybeNull } from '@blog/config/types';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/db/constants';
import { tenantPlanEnum } from '@blog/db/schema/tenant-plan-columns';
import { tenants } from '@blog/db/schema/tenants';
import { or, type SQL, sql } from 'drizzle-orm';

export type TPlanChangeFields = {
  plan: TTenantPlan;
  selfServeOwnerEmailIndex?: null;
  downgradeGraceStartedAt: TMaybeNull<SQL>;
  graceStartedEmailSentAt: TMaybeNull<SQL>;
  graceHalfwayEmailSentAt: TMaybeNull<SQL>;
  graceEndingEmailSentAt: TMaybeNull<SQL>;
  downgradedFromPlan: TMaybeNull<SQL>;
};

const PAID_SITE_STATUSES: readonly TTenantStatus[] = [
  TENANT_STATUS.ACTIVE,
  TENANT_STATUS.PAST_DUE,
];

const planType = sql.raw(tenantPlanEnum.enumName);

const isLeavingPaidPlanOrTrial = or(
  sql`${tenants.plan} <> ${TENANT_PLAN.FREE}::${planType}`,
  sql`${tenants.status} = ${TENANT_STATUS.TRIAL}`,
);

function startsGrace(column: SQL, value: SQL): SQL {
  return sql`case when ${isLeavingPaidPlanOrTrial} then ${value} else ${column} end`;
}

function graceFields(plan: TTenantPlan, now: Date) {
  if (plan !== TENANT_PLAN.FREE) {
    return {
      downgradeGraceStartedAt: null,
      graceStartedEmailSentAt: null,
      graceHalfwayEmailSentAt: null,
      graceEndingEmailSentAt: null,
      downgradedFromPlan: null,
    };
  }

  return {
    downgradeGraceStartedAt: startsGrace(
      sql`${tenants.downgradeGraceStartedAt}`,
      sql`${sql.param(now, tenants.downgradeGraceStartedAt)}::timestamp`,
    ),
    graceStartedEmailSentAt: startsGrace(
      sql`${tenants.graceStartedEmailSentAt}`,
      sql`null`,
    ),
    graceHalfwayEmailSentAt: startsGrace(
      sql`${tenants.graceHalfwayEmailSentAt}`,
      sql`null`,
    ),
    graceEndingEmailSentAt: startsGrace(
      sql`${tenants.graceEndingEmailSentAt}`,
      sql`null`,
    ),
    downgradedFromPlan: startsGrace(
      sql`${tenants.downgradedFromPlan}`,
      sql`${tenants.plan}`,
    ),
  };
}

// Only a move to a paid, running site gives up the Free-or-trial slot; leaving a paid plan or a trial for Free starts the downgrade grace, and a paid plan ends it.
export function planChangeFields(
  plan: TTenantPlan,
  status: TTenantStatus,
  now: Date,
): TPlanChangeFields {
  const grace = graceFields(plan, now);

  return plan !== TENANT_PLAN.FREE && PAID_SITE_STATUSES.includes(status)
    ? { plan, selfServeOwnerEmailIndex: null, ...grace }
    : { plan, ...grace };
}
