import { clearTenantProvisioningArtifacts } from '@blog/db/queries/tenants';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { clearTenantArtifacts } from './clear-artifacts';

vi.mock('@blog/db/queries/tenants');

faker.seed(5765);

const MOCK_TENANT = mockTenant();

describe(clearTenantArtifacts, () => {
  it('clears the persisted provisioning columns for the tenant', async () => {
    await clearTenantArtifacts(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(clearTenantProvisioningArtifacts).toHaveBeenCalledWith(
      MOCK_TENANT.id,
    );
  });

  it('does not write to the row in dry-run mode', async () => {
    await clearTenantArtifacts(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(clearTenantProvisioningArtifacts).not.toHaveBeenCalled();
  });
});
