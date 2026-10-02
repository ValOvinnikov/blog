import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { isTenantActive } from './is-tenant-active';

vi.mock('@blog/db', () => ({
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));

const buildTenant = (overrides: Partial<TTenant>) =>
  ({
    id: 'tenant-a',
    status: TENANT_STATUS.ACTIVE,
    deprovisionedAt: null,
    ...overrides,
  }) as TTenant;

describe(isTenantActive, () => {
  it('returns true for an active tenant', () => {
    expect(isTenantActive(buildTenant({}))).toBe(true);
  });

  it('returns false for a suspended tenant', () => {
    expect(
      isTenantActive(buildTenant({ status: TENANT_STATUS.SUSPENDED })),
    ).toBe(false);
  });

  it('returns false for an archived tenant', () => {
    expect(
      isTenantActive(buildTenant({ status: TENANT_STATUS.ARCHIVED })),
    ).toBe(false);
  });

  it('returns false for a deprovisioned tenant that is still marked active', () => {
    expect(isTenantActive(buildTenant({ deprovisionedAt: new Date() }))).toBe(
      false,
    );
  });
});
