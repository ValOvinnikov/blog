export {};

const { requireAdminMock, dispatchProvisioningWorkflowMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    dispatchProvisioningWorkflowMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('./dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

describe('retryProvisioningStepAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(undefined);
  });

  it('requires an admin session before dispatching', async () => {
    requireAdminMock.mockImplementation(() => {
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
