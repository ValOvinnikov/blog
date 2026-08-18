export {};

const { requireSuperAdminMock, dispatchProvisioningWorkflowMock } = vi.hoisted(
  () => ({
    requireSuperAdminMock: vi.fn(),
    dispatchProvisioningWorkflowMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('./dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

describe('retryProvisioningStepAction', () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(undefined);
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
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('re-dispatches the provisioning workflow for the given tenant id', async () => {
    const { retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action');

    await retryProvisioningStepAction('tenant-1');

    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
  });
});
