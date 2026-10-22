import { ACTION_OUTCOME, HTTP_STATUS } from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { logger } from '@platform/utils/logger/logger';

import { startProvisioning } from './start-provisioning';

const { enqueueProvisioningMock } = vi.hoisted(() => ({
  enqueueProvisioningMock: vi.fn(),
}));

vi.mock('./enqueue-provisioning', () => ({
  enqueueProvisioning: enqueueProvisioningMock,
}));

const loggerErrorMock = vi.mocked(logger.error);

describe(startProvisioning, () => {
  beforeEach(() => {
    loggerErrorMock.mockReset();
    enqueueProvisioningMock.mockReset();
  });

  it('succeeds when the worker accepts the run', async () => {
    enqueueProvisioningMock.mockResolvedValue(HTTP_STATUS.ACCEPTED);

    const result = await startProvisioning('tenant-1');

    expect(enqueueProvisioningMock).toHaveBeenCalledWith('tenant-1');
    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses as already in progress, without logging, when a run is in progress', async () => {
    enqueueProvisioningMock.mockResolvedValue(HTTP_STATUS.CONFLICT);

    const result = await startProvisioning('tenant-1');

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });
  });

  it('refuses as not found and logs when the worker cannot find the tenant', async () => {
    enqueueProvisioningMock.mockResolvedValue(HTTP_STATUS.NOT_FOUND);

    const result = await startProvisioning('tenant-1');

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'provisioning.enqueue_not_found',
      { tenantId: 'tenant-1' },
    );
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it.each([
    HTTP_STATUS.BAD_REQUEST,
    HTTP_STATUS.UNAUTHORIZED,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ])(
    'logs and returns a server error when the worker answers %i',
    async (responseStatus) => {
      enqueueProvisioningMock.mockResolvedValue(responseStatus);

      const result = await startProvisioning('tenant-1');

      expect(loggerErrorMock).toHaveBeenCalledWith(
        'provisioning.enqueue_failed',
        { tenantId: 'tenant-1', responseStatus },
      );
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    },
  );

  it('returns a server error without a second log when the enqueue never arrived', async () => {
    enqueueProvisioningMock.mockResolvedValue(null);

    const result = await startProvisioning('tenant-1');

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
