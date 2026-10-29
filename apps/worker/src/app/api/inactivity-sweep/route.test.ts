import { HTTP_STATUS } from '@blog/config/constants';
import { INACTIVITY_STAGE } from '@blog/db/constants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { INACTIVITY_SWEEP_LOG } from '@worker/constants/inactivity-sweep';
import { RETENTION_KIND } from '@worker/constants/retention';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_CRON_SECRET,
  cronRequest as cronRequestTo,
} from '@worker/testing/cron/fixtures';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockInactivitySweepEnv } from '@worker/testing/inactivity-sweep-env/fake-inactivity-sweep-env';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { getInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import { runInactivitySweep } from '@worker/utils/inactivity-sweep/run-inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';
import { runRetentionCleanups } from '@worker/utils/retention/run-retention-cleanups';

import { GET } from './route';

const MOCK_SWEEP_URL = `${MOCK_WORKER_ORIGIN}/api/inactivity-sweep`;
const MOCK_SWEEP_ENV = mockInactivitySweepEnv();
const MOCK_ADVANCED = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: 2,
  [INACTIVITY_STAGE.SUSPENSION]: 1,
  [INACTIVITY_STAGE.DELETION_NOTICE]: 0,
  [INACTIVITY_STAGE.DEPROVISIONING]: 0,
};
const MOCK_DELETED = {
  [RETENTION_KIND.LEADS]: 4,
  [RETENTION_KIND.SESSIONS]: 9,
};

vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/inactivity-sweep/inactivity-sweep-env');
vi.mock('@worker/utils/inactivity-sweep/run-inactivity-sweep');
vi.mock('@worker/utils/retention/run-retention-cleanups');

function cronRequest(secret?: string): Request {
  return cronRequestTo(MOCK_SWEEP_URL, secret);
}

describe('GET /api/inactivity-sweep', () => {
  beforeEach(() => {
    freezeClock();
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
    vi.mocked(getInactivitySweepEnv).mockReturnValue(MOCK_SWEEP_ENV);
    vi.mocked(runInactivitySweep).mockResolvedValue(MOCK_ADVANCED);
    vi.mocked(runRetentionCleanups).mockResolvedValue(MOCK_DELETED);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the sweep and retention cleanups for now and answers with both results', async () => {
    const response = await GET(cronRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual({
      advanced: MOCK_ADVANCED,
      deleted: MOCK_DELETED,
    });
    expect(runInactivitySweep).toHaveBeenCalledWith({
      now: MOCK_NOW,
      env: MOCK_SWEEP_ENV,
    });
    expect(runRetentionCleanups).toHaveBeenCalledWith(MOCK_NOW);
  });

  it('refuses a request without the cron secret', async () => {
    const response = await GET(cronRequest(MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
    expect(runInactivitySweep).not.toHaveBeenCalled();
  });

  it('logs and refuses every request while the cron secret is unset', async () => {
    mockEnv.CRON_SECRET = undefined;

    const response = await GET(cronRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      INACTIVITY_SWEEP_LOG.NOT_CONFIGURED,
    );
    expect(runInactivitySweep).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the sweep cannot run', async () => {
    vi.mocked(runInactivitySweep).mockRejectedValue(new Error(MOCK_DB_DOWN));

    const response = await GET(cronRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(INACTIVITY_SWEEP_LOG.FAILED, {
      error: MOCK_DB_DOWN,
    });
  });

  it('still runs the retention cleanups when the sweep fails', async () => {
    vi.mocked(runInactivitySweep).mockRejectedValue(new Error(MOCK_DB_DOWN));

    await GET(cronRequest());

    expect(runRetentionCleanups).toHaveBeenCalledWith(MOCK_NOW);
  });
});
