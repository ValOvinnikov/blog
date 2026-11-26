import type { TTenantsPageRow } from '@shinefold/db/queries/tenants/tenants-page-row';
import { isNull } from '@shinefold/utils/primitives';

export type TPinnedTenant = Pick<
  TTenantsPageRow,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'plan'
  | 'status'
  | 'provisioningStatus'
  | 'deprovisionedAt'
>;

export type TPinChange = {
  tenant: TPinnedTenant;
  isPinned: boolean;
};

export const toPinnedTenant = ({
  id,
  name,
  primaryDomain,
  plan,
  status,
  provisioningStatus,
  deprovisionedAt,
}: TPinnedTenant): TPinnedTenant => ({
  id,
  name,
  primaryDomain,
  plan,
  status,
  provisioningStatus,
  deprovisionedAt,
});

export const isArchivedTenant = ({
  deprovisionedAt,
}: Pick<TPinnedTenant, 'deprovisionedAt'>): boolean => !isNull(deprovisionedAt);

export const applyPinChange = (
  pinned: TPinnedTenant[],
  { tenant, isPinned }: TPinChange,
): TPinnedTenant[] => {
  const others = pinned.filter(({ id }) => id !== tenant.id);

  if (!isPinned || isArchivedTenant(tenant)) {
    return others;
  }

  return [...others, tenant].sort((a, b) => a.name.localeCompare(b.name));
};
