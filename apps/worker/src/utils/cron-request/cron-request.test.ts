import { HTTP_STATUS } from '@shinefold/config/constants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_CRON_SECRET, cronRequest } from '@worker/testing/cron/fixtures';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { rejectCronRequest } from './cron-request';

vi.mock('@worker/utils/env/env');

const MOCK_CRON_URL = `${MOCK_WORKER_ORIGIN}/api/some-sweep`;
const MOCK_NOT_CONFIGURED_EVENT = 'some_sweep.not_configured';

describe(rejectCronRequest, () => {
  beforeEach(() => {
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
  });

  it('lets a request carrying the cron secret through', () => {
    expect(
      rejectCronRequest(cronRequest(MOCK_CRON_URL), MOCK_NOT_CONFIGURED_EVENT),
    ).toBeNull();
  });

  it('answers 401 to any other bearer', async () => {
    const rejection = rejectCronRequest(
      cronRequest(MOCK_CRON_URL, MOCK_FORGED_SECRET),
      MOCK_NOT_CONFIGURED_EVENT,
    );

    expect(rejection?.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    await expect(rejection?.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
  });

  it('logs the given event and answers 500 while the cron secret is unset', () => {
    mockEnv.CRON_SECRET = undefined;

    const rejection = rejectCronRequest(
      cronRequest(MOCK_CRON_URL),
      MOCK_NOT_CONFIGURED_EVENT,
    );

    expect(rejection?.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(MOCK_NOT_CONFIGURED_EVENT);
  });
});
