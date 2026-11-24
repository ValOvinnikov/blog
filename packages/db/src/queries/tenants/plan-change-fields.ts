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
  keeps: SQL;
  starts: SQL;
};

const PAID_SITE_STATUSES: readonly TTenantStatus[] = [
  TENANT_STATUS.ACTIVE,
  TENANT_STATUS.PAST_DUE,
];

const planType = sql.raw(tenantPlanEnum.enumName);

export const isOnTrial = sql`${tenants.status} = ${TENANT_STATUS.TRIAL}`;

const isInGrace = sql`${tenants.downgradeGraceStartedAt} is not null`;

const FREE_GRACE_RULE: TGraceRule = {
  keeps: isInGrace,
  starts: sql`(${tenants.plan} <> ${TENANT_PLAN.FREE}::${planType} or ${isOnTrial})`,
};

function paidGraceRule(plan: TTenantPlan): TGraceRule {
  const { seats } = PLAN_ENTITLEMENTS[plan];
  const isOverSeats = sql`${seatsInUse(tenants.id)} > ${seats}`;

  return {
    keeps: sql`(${isInGrace} and ${isOverSeats})`,
    starts: sql`(${planSeats()} > ${seats} and ${isOverSeats})`,
  };
}

function graceField(
  { keeps, starts }: TGraceRule,
  column: SQL,
  value: SQL,
): SQL {
  return sql`case when ${keeps} then ${column} when ${starts} then ${value} else null end`;
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

// A running grace keeps its deadline through any move that still leaves the site over its seats, and on a paid plan ends only once they fit.
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
