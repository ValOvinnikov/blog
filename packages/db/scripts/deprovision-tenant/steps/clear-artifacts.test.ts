import { faker } from '@faker-js/faker';
import { clearTenantProvisioningArtifacts } from '@shinefold/db/queries/tenants';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@shinefold/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@shinefold/db/testing/tenants/fixtures';

import { clearTenantArtifacts } from './clear-artifacts';

vi.mock('@shinefold/db/queries/tenants');

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
