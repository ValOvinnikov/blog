import { logger } from '@platform/utils/logger/logger';

const {
  dispatchProvisioningWorkflowMock,
  beginTenantProvisioningMock,
  setTenantProvisioningStatusMock,
} = vi.hoisted(() => ({
  dispatchProvisioningWorkflowMock: vi.fn(),
  beginTenantProvisioningMock: vi.fn(),
  setTenantProvisioningStatusMock: vi.fn(),
}));

vi.mock('./dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@platform/utils/logger/logger');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      beginTenantProvisioning: beginTenantProvisioningMock,
      setTenantProvisioningStatus: setTenantProvisioningStatusMock,
    },
  },
}));

const loggerErrorMock = vi.mocked(logger.error);

describe('startProvisioning', () => {
  let startProvisioning: typeof import('./start-provisioning').startProvisioning;

  beforeEach(async () => {
    loggerErrorMock.mockReset();
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(true);
    beginTenantProvisioningMock.mockReset();
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: {
        tenant: { id: 'tenant-1' },
        previousProvisioningStatus: 'FAILED',
      },
    });
    setTenantProvisioningStatusMock.mockReset();
    setTenantProvisioningStatusMock.mockResolvedValue({
      ok: true,
      data: { id: 'tenant-1' },
    });
    ({ startProvisioning } = await import('./start-provisioning'));
  });

  it('begins provisioning then dispatches the workflow', async () => {
    const result = await startProvisioning('tenant-1');

    expect(beginTenantProvisioningMock).toHaveBeenCalledWith('tenant-1');
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'dispatched' });
  });

  it('returns "already-in-progress" without dispatching or logging when a concurrent dispatch is reported', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_ALREADY_PROVISIONING',
    });

    const result = await startProvisioning('tenant-1');

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'already-in-progress' });
  });

  it('returns "not-found" and logs when beginning provisioning fails otherwise', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });

    const result = await startProvisioning('tenant-1');

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith('provisioning.begin_failed', {
      tenantId: 'tenant-1',
      error: 'DB_NOT_FOUND',
    });
    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('reverts to the previous provisioning status and returns "dispatch-error" when the dispatch fails', async () => {
    dispatchProvisioningWorkflowMock.mockResolvedValue(false);

    const result = await startProvisioning('tenant-1');

    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-1',
      'FAILED',
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'dispatch-error' });
  });

  it('logs when the revert after a failed dispatch also fails', async () => {
    dispatchProvisioningWorkflowMock.mockResolvedValue(false);
    setTenantProvisioningStatusMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });

    const result = await startProvisioning('tenant-1');

    expect(loggerErrorMock).toHaveBeenCalledWith('provisioning.revert_failed', {
      tenantId: 'tenant-1',
      error: 'DB_NOT_FOUND',
    });
    expect(result).toEqual({ outcome: 'dispatch-error' });
  });
});
