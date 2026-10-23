import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import { clearTenantArtifacts } from './clear-artifacts';

const { clearTenantProvisioningArtifactsMock } = vi.hoisted(() => ({
  clearTenantProvisioningArtifactsMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  clearTenantProvisioningArtifacts: clearTenantProvisioningArtifactsMock,
}));

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  clearTenantProvisioningArtifactsMock.mockReset().mockResolvedValue(undefined);
});

describe(clearTenantArtifacts, () => {
  it('clears the persisted provisioning columns for the tenant', async () => {
    await clearTenantArtifacts(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(clearTenantProvisioningArtifactsMock).toHaveBeenCalledWith(
      MOCK_TENANT.id,
    );
  });

  it('does not write to the row in dry-run mode', async () => {
    await clearTenantArtifacts(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(clearTenantProvisioningArtifactsMock).not.toHaveBeenCalled();
  });
});
