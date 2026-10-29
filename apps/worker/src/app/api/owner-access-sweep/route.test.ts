import { HTTP_STATUS } from '@blog/config/constants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { MOCK_CRON_SECRET, cronRequest } from '@worker/testing/cron/fixtures';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { runOwnerAccessSweep } from '@worker/utils/owner-access-sweep/run-owner-access-sweep';

import { GET } from './route';

const MOCK_SWEEP_URL = `${MOCK_WORKER_ORIGIN}/api/owner-access-sweep`;
const MOCK_SWEEP_RESULT = { checked: 3, failed: 1 };

vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/owner-access-sweep/run-owner-access-sweep');

describe('GET /api/owner-access-sweep', () => {
  beforeEach(() => {
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
    vi.mocked(runOwnerAccessSweep).mockResolvedValue(MOCK_SWEEP_RESULT);
  });

  it('runs the sweep and answers with its counts', async () => {
    const response = await GET(cronRequest(MOCK_SWEEP_URL));

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual(MOCK_SWEEP_RESULT);
  });

  it('refuses a request without the cron secret', async () => {
    const response = await GET(cronRequest(MOCK_SWEEP_URL, MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(runOwnerAccessSweep).not.toHaveBeenCalled();
  });

  it('logs and refuses every request while the cron secret is unset', async () => {
    mockEnv.CRON_SECRET = undefined;

    const response = await GET(cronRequest(MOCK_SWEEP_URL));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      OWNER_ACCESS_LOG.SWEEP_NOT_CONFIGURED,
    );
    expect(runOwnerAccessSweep).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the sweep cannot run', async () => {
    vi.mocked(runOwnerAccessSweep).mockRejectedValue(new Error(MOCK_DB_DOWN));

    const response = await GET(cronRequest(MOCK_SWEEP_URL));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(OWNER_ACCESS_LOG.SWEEP_FAILED, {
      error: MOCK_DB_DOWN,
    });
  });
});
