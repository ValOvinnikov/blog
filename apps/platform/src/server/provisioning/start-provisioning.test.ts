import { ACTION_OUTCOME, HTTP_STATUS } from '@blog/config';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { enqueueProvisioning } from '@platform/server/provisioning/enqueue-provisioning';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { startProvisioning } from './start-provisioning';

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueProvisioning: vi.fn(),
}));

const loggerErrorMock = vi.mocked(logger.error);

describe(startProvisioning, () => {
  it('succeeds when the worker accepts the run', async () => {
    vi.mocked(enqueueProvisioning).mockResolvedValueOnce(HTTP_STATUS.ACCEPTED);

    const result = await startProvisioning(MOCK_TENANT_ID);

    expect(enqueueProvisioning).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses as already in progress, without logging, when a run is in progress', async () => {
    vi.mocked(enqueueProvisioning).mockResolvedValueOnce(HTTP_STATUS.CONFLICT);

    const result = await startProvisioning(MOCK_TENANT_ID);

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });
  });

  it('refuses as not found and logs when the worker cannot find the tenant', async () => {
    vi.mocked(enqueueProvisioning).mockResolvedValueOnce(HTTP_STATUS.NOT_FOUND);

    const result = await startProvisioning(MOCK_TENANT_ID);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.ENQUEUE_NOT_FOUND,
      { tenantId: MOCK_TENANT_ID },
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
      vi.mocked(enqueueProvisioning).mockResolvedValueOnce(responseStatus);

      const result = await startProvisioning(MOCK_TENANT_ID);

      expect(loggerErrorMock).toHaveBeenCalledWith(
        PROVISIONING_LOG.ENQUEUE_FAILED,
        { tenantId: MOCK_TENANT_ID, responseStatus },
      );
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    },
  );

  it('returns a server error without a second log when the enqueue never arrived', async () => {
    vi.mocked(enqueueProvisioning).mockResolvedValueOnce(null);

    const result = await startProvisioning(MOCK_TENANT_ID);

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
