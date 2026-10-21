import type * as TenantsQueries from '@blog/db/queries/tenants';

export function withFakeTenantsQueries(
  actual: typeof TenantsQueries,
): typeof TenantsQueries {
  return {
    ...actual,
    beginTenantProvisioning: vi.fn(),
    getTenantById: vi.fn(),
    reactivateTenant: vi.fn(),
    updateProvisioningStep: vi.fn(),
    startProvisioningRun: vi.fn(),
    finishProvisioningRun: vi.fn(),
    setTenantProvisioningStatus: vi.fn(),
    setTenantOwnerAccess: vi.fn(),
    claimTenantOwnerEmail: vi.fn(),
    releaseTenantOwnerEmail: vi.fn(),
  };
}
