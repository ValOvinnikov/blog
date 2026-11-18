import type { TPlatformTenantSummary } from '@platform/utils/platform-tenant/platform-tenant';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TTenantSwitcherItem = Pick<
  TTenant,
  'id' | 'name' | 'primaryDomain'
> & {
  isArchived: boolean;
};

// The switcher is a client component, so everything returned here ships to
// the browser — a full tenant row would carry the Sanity token ciphertext.
export const toTenantSwitcherItems = (
  tenants: TPlatformTenantSummary[],
): TTenantSwitcherItem[] =>
  tenants.map(({ id, name, primaryDomain, isArchived }) => ({
    id,
    name,
    primaryDomain,
    isArchived,
  }));
