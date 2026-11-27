import { HTTP_STATUS } from '@shinefold/config/constants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_CRON_SECRET, cronRequest } from '@worker/testing/cron/fixtures';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { rejectCronRequest, runCronSweep } from './cron-request';

vi.mock('@worker/utils/env/env');

const MOCK_CRON_URL = `${MOCK_WORKER_ORIGIN}/api/some-sweep`;
const MOCK_EVENTS = {
  notConfigured: 'some_sweep.not_configured',
  failed: 'some_sweep.failed',
};
const MOCK_SWEEP_RESULT = { checked: 3, failed: 1 };

describe(rejectCronRequest, () => {
  beforeEach(() => {
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
  });

  it('lets a request carrying the cron secret through', () => {
    expect(
      rejectCronRequest(cronRequest(MOCK_CRON_URL), MOCK_EVENTS.notConfigured),
    ).toBeNull();
  });

  it('answers 401 to any other bearer', async () => {
    const rejection = rejectCronRequest(
      cronRequest(MOCK_CRON_URL, MOCK_FORGED_SECRET),
      MOCK_EVENTS.notConfigured,
    );

    expect(rejection?.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    await expect(rejection?.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
  });

  it('logs the given event and answers 500 while the secret is unset', () => {
    mockEnv.CRON_SECRET = undefined;

    const rejection = rejectCronRequest(
      cronRequest(MOCK_CRON_URL),
      MOCK_EVENTS.notConfigured,
    );

    expect(rejection?.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(MOCK_EVENTS.notConfigured);
  });
});

describe(runCronSweep, () => {
  const sweep = vi.fn();

  beforeEach(() => {
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
    sweep.mockResolvedValue(MOCK_SWEEP_RESULT);
  });

  it('runs the sweep and answers with its result', async () => {
    const response = await runCronSweep(
      cronRequest(MOCK_CRON_URL),
      MOCK_EVENTS,
      sweep,
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual(MOCK_SWEEP_RESULT);
  });

  it('runs nothing for a request without the cron secret', async () => {
    const response = await runCronSweep(
      cronRequest(MOCK_CRON_URL, MOCK_FORGED_SECRET),
      MOCK_EVENTS,
      sweep,
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(sweep).not.toHaveBeenCalled();
  });

  it('logs the failed event and answers 500 when the sweep throws', async () => {
    sweep.mockRejectedValue(new Error(MOCK_DB_DOWN));

    const response = await runCronSweep(
      cronRequest(MOCK_CRON_URL),
      MOCK_EVENTS,
      sweep,
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(MOCK_EVENTS.failed, {
      error: MOCK_DB_DOWN,
    });
  });
});
