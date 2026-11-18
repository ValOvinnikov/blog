import type { TGrantProvenance } from '@platform/utils/granted-entitlements/granted-entitlements';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';

export type TGrantTarget = {
  tenantId: string;
  tenantName: string;
  plan: TTenantPlan;
};

export type TGrantAccess<TKey extends string> = {
  target: TMaybeUndefined<TGrantTarget>;
  granted: Partial<Record<TKey, TGrantProvenance>>;
};

export const toGrantTarget = (
  {
    id,
    name,
    plan,
    isArchived,
  }: Pick<TPlatformTenant, 'id' | 'name' | 'plan' | 'isArchived'>,
  canGrant: boolean,
): TMaybeUndefined<TGrantTarget> =>
  canGrant && !isArchived
    ? { tenantId: id, tenantName: name, plan }
    : undefined;

export type TLanguageGrants = {
  target: TMaybeUndefined<TGrantTarget>;
  granted: TMaybeUndefined<TGrantProvenance>;
};
