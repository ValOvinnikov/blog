import {
  TENANT_PLAN,
  type TLocaleIsoCode,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { TENANT_STATUS, type TTenantStatus } from '@shinefold/db/constants';
import {
  isOnTrial,
  planChangeFields,
  type TPlanChangeFields,
} from '@shinefold/db/queries/tenants/plan-change-fields';
import { tenantStatusEnum } from '@shinefold/db/schema/tenant-enums';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { type SQL, sql } from 'drizzle-orm';

type TTenantDetailsFields = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: TLocaleIsoCode;
};

export function tenantDetailsFields(
  source: TTenantDetailsFields,
): TTenantDetailsFields {
  return {
    name: source.name,
    primaryDomain: source.primaryDomain,
    plan: source.plan,
    locale: source.locale,
  };
}

const EDITABLE_AFTER_PROVISIONING: readonly (keyof TTenantDetailsFields)[] = [
  'plan',
];

export function changesProvisionedTenantDetails(
  next: TTenantDetailsFields,
  existing: TTenant,
): boolean {
  const current = tenantDetailsFields(existing);
  return (Object.keys(current) as (keyof TTenantDetailsFields)[]).some(
    (key) =>
      !EDITABLE_AFTER_PROVISIONING.includes(key) && next[key] !== current[key],
  );
}

const statusType = sql.raw(tenantStatusEnum.enumName);

const trialEndedOnFreeStatus = sql`case when ${isOnTrial} then ${TENANT_STATUS.ACTIVE}::${statusType} else ${tenants.status} end`;

export function tenantDetailsWrite(
  details: TTenantDetailsFields,
  status: TTenantStatus,
  clearsUnsentReinvite: boolean,
  now: Date,
): TTenantDetailsFields &
  TPlanChangeFields & {
    status?: SQL;
    unsentReinviteFormerOwnerEmailEncrypted?: null;
  } {
  return {
    ...details,
    ...planChangeFields(details.plan, status, now),
    ...(details.plan === TENANT_PLAN.FREE && {
      status: trialEndedOnFreeStatus,
    }),
    ...(clearsUnsentReinvite && {
      unsentReinviteFormerOwnerEmailEncrypted: null,
    }),
  };
}

export function restorableTenantFields(
  original: TTenant,
): TTenantDetailsFields &
  Pick<
    TTenant,
    | 'status'
    | 'unsentReinviteFormerOwnerEmailEncrypted'
    | 'selfServeOwnerEmailIndex'
    | 'downgradeGraceStartedAt'
    | 'graceStartedEmailSentAt'
    | 'graceHalfwayEmailSentAt'
    | 'graceEndingEmailSentAt'
    | 'downgradedFromPlan'
  > {
  return {
    ...tenantDetailsFields(original),
    status: original.status,
    unsentReinviteFormerOwnerEmailEncrypted:
      original.unsentReinviteFormerOwnerEmailEncrypted,
    selfServeOwnerEmailIndex: original.selfServeOwnerEmailIndex,
    downgradeGraceStartedAt: original.downgradeGraceStartedAt,
    graceStartedEmailSentAt: original.graceStartedEmailSentAt,
    graceHalfwayEmailSentAt: original.graceHalfwayEmailSentAt,
    graceEndingEmailSentAt: original.graceEndingEmailSentAt,
    downgradedFromPlan: original.downgradedFromPlan,
  };
}
