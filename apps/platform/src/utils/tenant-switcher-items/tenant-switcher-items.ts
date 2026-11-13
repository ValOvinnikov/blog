import type { TTenant } from '@blog/db/schema/tenants';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TTenantSwitcherItem = Pick<
  TTenant,
  'id' | 'name' | 'primaryDomain'
> & {
  isArchived: boolean;
};

// The switcher is a client component, so everything returned here ships to
// the browser — a full tenant row would carry the Sanity token ciphertext.
export const toTenantSwitcherItems = (
  tenants: TPlatformTenant[],
): TTenantSwitcherItem[] =>
  tenants.map(({ id, name, primaryDomain, isArchived }) => ({
    id,
    name,
    primaryDomain,
    isArchived,
  }));
