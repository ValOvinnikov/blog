import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import {
  PLAN_ENTITLEMENTS,
  TENANT_STATUS,
  type TTenantStatus,
} from '@shinefold/db/constants';
import {
  planSeats,
  seatsInUse,
} from '@shinefold/db/queries/membership-invites/create-membership-invite/seat-limit';
import { tenantPlanEnum } from '@shinefold/db/schema/tenant-enums';
import { tenants } from '@shinefold/db/schema/tenants';
import { type SQL, sql } from 'drizzle-orm';

export type TPlanChangeFields = {
  plan: TTenantPlan;
  selfServeOwnerEmailIndex?: null;
  downgradeGraceStartedAt: TMaybeNull<SQL>;
  graceStartedEmailSentAt: TMaybeNull<SQL>;
  graceHalfwayEmailSentAt: TMaybeNull<SQL>;
  graceEndingEmailSentAt: TMaybeNull<SQL>;
  downgradedFromPlan: TMaybeNull<SQL>;
};

type TGraceRule = {
  starts: SQL;
  keeps: SQL;
};

const PAID_SITE_STATUSES: readonly TTenantStatus[] = [
  TENANT_STATUS.ACTIVE,
  TENANT_STATUS.PAST_DUE,
];

const planType = sql.raw(tenantPlanEnum.enumName);

export const isOnTrial = sql`${tenants.status} = ${TENANT_STATUS.TRIAL}`;

const FREE_GRACE_RULE: TGraceRule = {
  starts: sql`(${tenants.plan} <> ${TENANT_PLAN.FREE}::${planType} or ${isOnTrial})`,
  keeps: sql`true`,
};

function paidGraceRule(plan: TTenantPlan): TGraceRule {
  const { seats } = PLAN_ENTITLEMENTS[plan];

  return {
    starts: sql`(${planSeats()} > ${seats} and ${seatsInUse(tenants.id)} > ${seats})`,
    keeps: sql`${tenants.plan} = ${plan}::${planType}`,
  };
}

function graceField(
  { starts, keeps }: TGraceRule,
  column: SQL,
  value: SQL,
): SQL {
  return sql`case when ${starts} then ${value} when ${keeps} then ${column} else null end`;
}

function graceFields(plan: TTenantPlan, now: Date) {
  const rule =
    plan === TENANT_PLAN.FREE ? FREE_GRACE_RULE : paidGraceRule(plan);

  return {
    downgradeGraceStartedAt: graceField(
      rule,
      sql`${tenants.downgradeGraceStartedAt}`,
      sql`${sql.param(now, tenants.downgradeGraceStartedAt)}::timestamp`,
    ),
    graceStartedEmailSentAt: graceField(
      rule,
      sql`${tenants.graceStartedEmailSentAt}`,
      sql`null`,
    ),
    graceHalfwayEmailSentAt: graceField(
      rule,
      sql`${tenants.graceHalfwayEmailSentAt}`,
      sql`null`,
    ),
    graceEndingEmailSentAt: graceField(
      rule,
      sql`${tenants.graceEndingEmailSentAt}`,
      sql`null`,
    ),
    downgradedFromPlan: graceField(
      rule,
      sql`${tenants.downgradedFromPlan}`,
      sql`${tenants.plan}`,
    ),
  };
}

// The grace starts on leaving a paid plan or a trial for Free, or for a plan with fewer seats than the site uses, and survives only a rewrite of the same plan.
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
