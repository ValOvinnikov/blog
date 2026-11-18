import {
  GRANT_STATUS,
  type TGrantStatus,
} from '@platform/constants/entitlement-grant';
import { hasGrantExpired } from '@platform/utils/granted-entitlements/granted-entitlements';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import {
  ENTITLEMENT_KIND,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
} from '@shinefold/db/constants';
import type { TListedEntitlementGrant } from '@shinefold/db/queries/tenant-entitlement-grants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export type TGrantRow = Pick<
  TListedEntitlementGrant,
  | 'id'
  | 'kind'
  | 'key'
  | 'value'
  | 'note'
  | 'grantedByEmail'
  | 'grantedAt'
  | 'expiresAt'
> & { status: TGrantStatus };

const isCoveredByPlan = (
  plan: TTenantPlan,
  { kind, key, value }: Pick<TGrantRow, 'kind' | 'key' | 'value'>,
): boolean => {
  const planEntitlements = PLAN_ENTITLEMENTS[plan];

  switch (kind) {
    case ENTITLEMENT_KIND.CAPABILITY:
      return isOneOf(PLAN_REGISTRY[plan], key);
    case ENTITLEMENT_KIND.LOOK_FIELD:
      return isOneOf(planEntitlements.lookFields, key);
    case ENTITLEMENT_KIND.MODULE_PACK:
      return isOneOf(planEntitlements.modulePacks, key);
    case ENTITLEMENT_KIND.LOCALE_LIMIT:
      return !isNull(value) && value <= PLAN_LOCALE_LIMIT[plan];
  }
};

const statusOf = (
  plan: TTenantPlan,
  grant: Pick<TGrantRow, 'kind' | 'key' | 'value'> & {
    expiresAt: TMaybeNull<Date>;
  },
  now: Date,
): TGrantStatus => {
  if (hasGrantExpired(grant.expiresAt, now)) return GRANT_STATUS.EXPIRED;

  return isCoveredByPlan(plan, grant)
    ? GRANT_STATUS.INCLUDED
    : GRANT_STATUS.ACTIVE;
};

export const toGrantRows = (
  grants: readonly TListedEntitlementGrant[],
  plan: TTenantPlan,
  now: Date,
): TGrantRow[] =>
  grants.map(
    ({ id, kind, key, value, note, grantedByEmail, grantedAt, expiresAt }) => ({
      id,
      kind,
      key,
      value,
      note,
      grantedByEmail,
      grantedAt,
      expiresAt,
      status: statusOf(plan, { kind, key, value, expiresAt }, now),
    }),
  );
