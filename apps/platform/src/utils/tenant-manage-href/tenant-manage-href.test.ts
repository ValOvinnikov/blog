import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';

import { tenantManageHref } from './tenant-manage-href';

describe(tenantManageHref, () => {
  it('links a ready tenant to its overview page', () => {
    const href = tenantManageHref({
      id: MOCK_TENANT_ID,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    expect(href).toBe(adminRoutes.tenantOverview(MOCK_TENANT_ID));
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])('links a %s tenant to its provisioning page', (provisioningStatus) => {
    const href = tenantManageHref({ id: MOCK_TENANT_ID, provisioningStatus });

    expect(href).toBe(adminRoutes.tenantProvisioning(MOCK_TENANT_ID));
  });
});
