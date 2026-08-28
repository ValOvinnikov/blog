import { notFound, redirect } from 'next/navigation';

const {
  requireSuperAdminMock,
  dispatchProvisioningWorkflowMock,
  beginTenantProvisioningMock,
  setTenantProvisioningStatusMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  dispatchProvisioningWorkflowMock: vi.fn(),
  beginTenantProvisioningMock: vi.fn(),
  setTenantProvisioningStatusMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('./dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      beginTenantProvisioning: beginTenantProvisioningMock,
      setTenantProvisioningStatus: setTenantProvisioningStatusMock,
    },
  },
}));

describe('retryProvisioningStepAction', () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    vi.mocked(redirect).mockClear();
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(true);
    beginTenantProvisioningMock.mockReset();
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: {
        tenant: { id: 'tenant-1' },
        previousProvisioningStatus: 'PENDING',
      },
    });
    setTenantProvisioningStatusMock.mockReset();
    setTenantProvisioningStatusMock.mockResolvedValue({
      ok: true,
      data: { id: 'tenant-1' },
    });
  });

  it('requires a super-admin session before dispatching', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    await expect(retryProvisioningStepAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(beginTenantProvisioningMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's 404, before touching provisioning", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    await expect(retryProvisioningStepAction('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(beginTenantProvisioningMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('begins provisioning then dispatches the workflow, returning "dispatched" on success', async () => {
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    const result = await retryProvisioningStepAction('tenant-1');

    expect(beginTenantProvisioningMock).toHaveBeenCalledWith('tenant-1');
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'dispatched' });
  });

  it('returns "already-in-progress" without dispatching when the atomic guard reports a concurrent dispatch', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_ALREADY_PROVISIONING',
    });
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    const result = await retryProvisioningStepAction('tenant-1');

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'already-in-progress' });
  });

  it('returns "not-found" without dispatching when the tenant does not exist', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    const result = await retryProvisioningStepAction('tenant-1');

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('reverts the PROVISIONING transition and returns "dispatch-error" when the GitHub dispatch fails', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: {
        tenant: { id: 'tenant-1' },
        previousProvisioningStatus: 'FAILED',
      },
    });
    dispatchProvisioningWorkflowMock.mockResolvedValue(false);
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    const result = await retryProvisioningStepAction('tenant-1');

    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-1',
      'FAILED',
    );
    expect(result).toEqual({ outcome: 'dispatch-error' });
  });
});
