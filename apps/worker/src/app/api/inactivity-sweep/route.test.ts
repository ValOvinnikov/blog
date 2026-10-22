import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { INACTIVITY_STAGE } from '@blog/db/constants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  INACTIVITY_SWEEP_FAILED_EVENT,
  INACTIVITY_SWEEP_NOT_CONFIGURED_EVENT,
} from '@worker/constants/inactivity-sweep';
import { TEST_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import { makeInactivitySweepEnv } from '@worker/testing/inactivity-sweep-env/fake-inactivity-sweep-env';
import { getInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import { runInactivitySweep } from '@worker/utils/inactivity-sweep/run-inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';

import { GET } from './route';

const SWEEP_URL = 'https://worker.example.com/api/inactivity-sweep';
const CRON_SECRET = 'cron-secret';
const FORGED_SECRET = 'forged-secret';
const DB_DOWN = 'db down';
const SWEEP_ENV = makeInactivitySweepEnv();
const ADVANCED = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: 2,
  [INACTIVITY_STAGE.SUSPENSION]: 1,
  [INACTIVITY_STAGE.DELETION_NOTICE]: 0,
  [INACTIVITY_STAGE.DEPROVISIONING]: 0,
};

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/utils/inactivity-sweep/inactivity-sweep-env');
vi.mock('@worker/utils/inactivity-sweep/run-inactivity-sweep');

function cronRequest(secret: string = CRON_SECRET): Request {
  return new Request(SWEEP_URL, {
    headers: { Authorization: `Bearer ${secret}` },
  });
}

describe('GET /api/inactivity-sweep', () => {
  beforeEach(() => {
    freezeClock();
    mockEnv.CRON_SECRET = CRON_SECRET;
    vi.mocked(getInactivitySweepEnv).mockReturnValue(SWEEP_ENV);
    vi.mocked(runInactivitySweep).mockResolvedValue(ADVANCED);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the sweep for now and answers with what it advanced', async () => {
    const response = await GET(cronRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual({ advanced: ADVANCED });
    expect(runInactivitySweep).toHaveBeenCalledWith({
      now: TEST_NOW,
      env: SWEEP_ENV,
    });
  });

  it('refuses a request without the cron secret', async () => {
    const response = await GET(cronRequest(FORGED_SECRET));

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
      INACTIVITY_SWEEP_NOT_CONFIGURED_EVENT,
    );
    expect(runInactivitySweep).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the sweep cannot run', async () => {
    vi.mocked(runInactivitySweep).mockRejectedValue(new Error(DB_DOWN));

    const response = await GET(cronRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(INACTIVITY_SWEEP_FAILED_EVENT, {
      error: DB_DOWN,
    });
  });
});
