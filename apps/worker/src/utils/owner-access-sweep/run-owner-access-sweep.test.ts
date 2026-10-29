import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import { listTenantsPendingOwnerElevation } from '@blog/db/queries/tenants';
import {
  OWNER_ACCESS_LOG,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { runOwnerAccessSweep } from './run-owner-access-sweep';

const MOCK_OTHER_TENANT_ID = 'tenant-other';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/owner-access-run/owner-access-run');

describe(runOwnerAccessSweep, () => {
  beforeEach(() => {
    vi.mocked(wakeOwnerAccess).mockResolvedValue(undefined);
  });

  it('checks once every tenant whose owner access is still pending', async () => {
    vi.mocked(listTenantsPendingOwnerElevation).mockResolvedValue([
      mockProvisionedTenant(),
      mockProvisionedTenant({
        id: MOCK_OTHER_TENANT_ID,
        ownerSanityRole: SANITY_PROJECT_ROLE.VIEWER,
      }),
    ]);

    const result = await runOwnerAccessSweep();

    expect(vi.mocked(wakeOwnerAccess).mock.calls).toEqual([
      [MOCK_TENANT_ID, OWNER_ACCESS_SWEEP_CHECKS],
      [MOCK_OTHER_TENANT_ID, OWNER_ACCESS_SWEEP_CHECKS],
    ]);
    expect(result).toEqual({ checked: 2, failed: 0 });
  });

  it('starts nothing for a tenant whose owner is already administrator', async () => {
    vi.mocked(listTenantsPendingOwnerElevation).mockResolvedValue([
      mockProvisionedTenant({
        ownerSanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      }),
    ]);

    const result = await runOwnerAccessSweep();

    expect(wakeOwnerAccess).not.toHaveBeenCalled();
    expect(result).toEqual({ checked: 0, failed: 0 });
  });

  it('logs a tenant it cannot check and carries on with the rest', async () => {
    vi.mocked(listTenantsPendingOwnerElevation).mockResolvedValue([
      mockProvisionedTenant(),
      mockProvisionedTenant({ id: MOCK_OTHER_TENANT_ID }),
    ]);
    vi.mocked(wakeOwnerAccess).mockRejectedValueOnce(
      new Error(MOCK_QUEUE_DOWN),
    );

    const result = await runOwnerAccessSweep();

    expect(logger.error).toHaveBeenCalledWith(
      OWNER_ACCESS_LOG.SWEEP_TENANT_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_QUEUE_DOWN },
    );
    expect(wakeOwnerAccess).toHaveBeenCalledWith(
      MOCK_OTHER_TENANT_ID,
      OWNER_ACCESS_SWEEP_CHECKS,
    );
    expect(result).toEqual({ checked: 1, failed: 1 });
  });
});
