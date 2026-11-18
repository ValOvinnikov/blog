import {
  GRANT_STATUS,
  type TGrantStatus,
} from '@platform/constants/entitlement-grant';
import { isCoveredByPlan } from '@platform/utils/is-covered-by-plan/is-covered-by-plan';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import type { TListedEntitlementGrant } from '@shinefold/db/queries/tenant-entitlement-grants';
import { isEntitlementGrantActive } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { isNull } from '@shinefold/utils/primitives';

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

const statusOf = (
  plan: TTenantPlan,
  grant: Pick<TGrantRow, 'kind' | 'key' | 'value'> & {
    expiresAt: TMaybeNull<Date>;
    revokedAt: TMaybeNull<Date>;
  },
  now: Date,
): TGrantStatus => {
  if (isNull(grant.revokedAt) && !isEntitlementGrantActive(grant, now)) {
    return GRANT_STATUS.EXPIRED;
  }

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
    ({
      id,
      kind,
      key,
      value,
      note,
      grantedByEmail,
      grantedAt,
      expiresAt,
      revokedAt,
    }) => ({
      id,
      kind,
      key,
      value,
      note,
      grantedByEmail,
      grantedAt,
      expiresAt,
      status: statusOf(plan, { kind, key, value, expiresAt, revokedAt }, now),
    }),
  );
