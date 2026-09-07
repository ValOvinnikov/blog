import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { isTenantServable } from './is-tenant-servable';

const { isProductionEnvironmentMock } = vi.hoisted(() => ({
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
  TENANT_PROVISIONING_STATUS: {
    PENDING: 'PENDING',
    PROVISIONING: 'PROVISIONING',
    READY: 'READY',
    FAILED: 'FAILED',
  },
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const buildServableTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    primaryDomain: 'acme.example.com',
    status: TENANT_STATUS.ACTIVE,
    sanityProjectId: 'proj',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted-token',
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    ...overrides,
  } as TTenant;
};

describe(isTenantServable, () => {
  beforeEach(() => {
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('accepts a READY tenant with credentials in production', () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const tenant = buildServableTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    expect(isTenantServable(tenant)).toBe(true);
  });

  it('rejects a non-READY tenant in production even with credentials present', () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const tenant = buildServableTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    });

    expect(isTenantServable(tenant)).toBe(false);
  });

  it('rejects a tenant with no provisioningStatus recorded in production', () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const tenant = buildServableTenant({ provisioningStatus: null });

    expect(isTenantServable(tenant)).toBe(false);
  });

  it('does not require READY outside production', () => {
    isProductionEnvironmentMock.mockReturnValue(false);
    const tenant = buildServableTenant({ provisioningStatus: null });

    expect(isTenantServable(tenant)).toBe(true);
  });

  it('rejects an archived tenant regardless of provisioning status', () => {
    isProductionEnvironmentMock.mockReturnValue(false);
    const tenant = buildServableTenant({ status: TENANT_STATUS.ARCHIVED });

    expect(isTenantServable(tenant)).toBe(false);
  });

  it('rejects a tenant missing Sanity credentials regardless of provisioning status', () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const tenant = buildServableTenant({
      sanityProjectId: null,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    expect(isTenantServable(tenant)).toBe(false);
  });
});
