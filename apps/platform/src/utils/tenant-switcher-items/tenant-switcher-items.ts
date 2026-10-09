import type { TTenant } from '@blog/db/schema/tenants';

export type TTenantSwitcherItem = Pick<
  TTenant,
  'id' | 'name' | 'primaryDomain'
> & {
  isArchived: boolean;
};

// The switcher is a client component, so everything returned here ships to
// the browser — a full tenant row would carry the Sanity token ciphertext.
export const toTenantSwitcherItems = (
  tenants: TTenant[],
): TTenantSwitcherItem[] =>
  tenants.map(({ id, name, primaryDomain, deprovisionedAt }) => ({
    id,
    name,
    primaryDomain,
    isArchived: Boolean(deprovisionedAt),
  }));
