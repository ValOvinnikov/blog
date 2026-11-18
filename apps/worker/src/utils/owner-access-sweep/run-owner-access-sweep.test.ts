import { SANITY_PROJECT_ROLE } from '@shinefold/db/constants';
import { listMembersPendingStudioAccess } from '@shinefold/db/queries/memberships';
import { listTenantsPendingOwnerElevation } from '@shinefold/db/queries/tenants';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  OWNER_ACCESS_LOG,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { MOCK_MEMBERSHIP_ID } from '@worker/testing/member-access/fixtures';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { wakeMemberAccess } from '@worker/utils/member-access-run/member-access-run';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { runOwnerAccessSweep } from './run-owner-access-sweep';

const MOCK_OTHER_TENANT_ID = 'tenant-other';

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@worker/utils/member-access-run/member-access-run');
vi.mock('@worker/utils/owner-access-run/owner-access-run');

describe(runOwnerAccessSweep, () => {
  beforeEach(() => {
    vi.mocked(wakeOwnerAccess).mockResolvedValue(undefined);
    vi.mocked(listMembersPendingStudioAccess).mockResolvedValue([]);
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

  describe('with members still waiting for Studio access', () => {
    beforeEach(() => {
      vi.mocked(listTenantsPendingOwnerElevation).mockResolvedValue([]);
      vi.mocked(listMembersPendingStudioAccess).mockResolvedValue([
        { tenantId: MOCK_TENANT_ID, membershipId: MOCK_MEMBERSHIP_ID },
      ]);
    });

    it('checks each of them once', async () => {
      const result = await runOwnerAccessSweep();

      expect(wakeMemberAccess).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        OWNER_ACCESS_SWEEP_CHECKS,
      );
      expect(result).toEqual({ checked: 1, failed: 0 });
    });

    it('logs a member it cannot check', async () => {
      vi.mocked(wakeMemberAccess).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

      const result = await runOwnerAccessSweep();

      expect(logger.error).toHaveBeenCalledWith(
        MEMBER_ACCESS_LOG.SWEEP_MEMBER_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          membershipId: MOCK_MEMBERSHIP_ID,
          error: MOCK_QUEUE_DOWN,
        },
      );
      expect(result).toEqual({ checked: 0, failed: 1 });
    });
  });
});
