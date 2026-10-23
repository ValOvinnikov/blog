import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { notFound, redirect } from 'next/navigation';

const {
  requireTenantOwnerOrAdminMock,
  startProvisioningMock,
  getTenantByIdMock,
} = vi.hoisted(() => ({
  requireTenantOwnerOrAdminMock: vi.fn(),
  startProvisioningMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-owner-or-admin', () => ({
  requireTenantOwnerOrAdmin: requireTenantOwnerOrAdminMock,
}));

vi.mock('./start-provisioning', () => ({
  startProvisioning: startProvisioningMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
    },
  },
}));

describe('retryProvisioningStepAction', () => {
  let retryProvisioningStepAction: typeof import('./retry-provisioning-step-action').retryProvisioningStepAction;

  beforeEach(async () => {
    requireTenantOwnerOrAdminMock.mockReset();
    requireTenantOwnerOrAdminMock.mockResolvedValue(undefined);
    startProvisioningMock.mockReset();
    startProvisioningMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      deprovisionedAt: null,
    });
    ({ retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action'));
  });

  it('requires a session before dispatching', async () => {
    requireTenantOwnerOrAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(retryProvisioningStepAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it('rejects a caller who is neither the owner nor a super-admin, before touching provisioning', async () => {
    requireTenantOwnerOrAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(retryProvisioningStepAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it("admits only the tenant's owner or a super-admin", async () => {
    await retryProvisioningStepAction(MOCK_TENANT_ID);

    const [tenantId, isAdminPermitted] = requireTenantOwnerOrAdminMock.mock
      .calls[0] as [string, (admin: TAdmin) => boolean];

    expect(tenantId).toBe(MOCK_TENANT_ID);
    expect(isAdminPermitted(mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }))).toBe(
      true,
    );
    expect(isAdminPermitted(mockAdmin())).toBe(false);
  });

  it.each([
    { outcome: ACTION_OUTCOME.SUCCESS },
    {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    },
    { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
    { outcome: ACTION_OUTCOME.SERVER_ERROR },
  ])('starts provisioning and returns its result %o', async (started) => {
    startProvisioningMock.mockResolvedValue(started);

    const result = await retryProvisioningStepAction(MOCK_TENANT_ID);

    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(result).toEqual(started);
  });

  it('refuses as not found without starting provisioning when the tenant does not exist', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await retryProvisioningStepAction('ghost');

    expect(getTenantByIdMock).toHaveBeenCalledWith('ghost', {
      includeArchived: true,
    });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it('rejects a start/retry against an archived tenant server-side, without starting provisioning', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    const result = await retryProvisioningStepAction(MOCK_TENANT_ID);

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
  });
});
