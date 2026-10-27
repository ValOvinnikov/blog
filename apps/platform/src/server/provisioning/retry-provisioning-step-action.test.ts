import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { queries } from '@blog/db';
import { ADMIN_ROLE } from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { retryProvisioningStepAction } from './retry-provisioning-step-action';

vi.mock('@platform/server/auth/require-tenant-owner-or-admin');

vi.mock('@platform/server/provisioning/start-provisioning');

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

const requireTenantOwnerOrAdminMock = vi.mocked(requireTenantOwnerOrAdmin);
const startProvisioningMock = vi.mocked(startProvisioning);
const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);

describe(retryProvisioningStepAction, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant());
  });

  it('stops before touching provisioning when the owner-or-admin gate rejects', async () => {
    requireTenantOwnerOrAdminMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(retryProvisioningStepAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it.each([
    { role: ADMIN_ROLE.SUPERADMIN, permitted: true },
    { role: ADMIN_ROLE.ADMIN, permitted: false },
  ])(
    'lets the gate admit a $role admin: $permitted',
    async ({ role, permitted }) => {
      await retryProvisioningStepAction(MOCK_TENANT_ID);

      const [tenantId, isAdminPermitted] =
        requireTenantOwnerOrAdminMock.mock.calls[0] ?? [];

      expect(tenantId).toBe(MOCK_TENANT_ID);
      expect(isAdminPermitted?.(mockAdmin({ role }))).toBe(permitted);
    },
  );

  it.each([
    { outcome: ACTION_OUTCOME.SUCCESS },
    {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    },
    { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
    { outcome: ACTION_OUTCOME.SERVER_ERROR },
  ] as const)(
    'starts provisioning and returns its result %o',
    async (started) => {
      startProvisioningMock.mockResolvedValueOnce(started);

      const result = await retryProvisioningStepAction(MOCK_TENANT_ID);

      expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(result).toEqual(started);
    },
  );

  it('refuses as not found without starting provisioning for an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValueOnce(undefined);

    const result = await retryProvisioningStepAction(MOCK_OTHER_TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID, {
      includeArchived: true,
    });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it('refuses an archived tenant without starting provisioning', async () => {
    getTenantByIdMock.mockResolvedValueOnce(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    const result = await retryProvisioningStepAction(MOCK_TENANT_ID);

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
  });
});
