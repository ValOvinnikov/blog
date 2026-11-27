import { HTTP_STATUS } from '@shinefold/config/constants';
import { DOCUMENT_CAP_LOG } from '@worker/constants/document-cap';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_CRON_SECRET, cronRequest } from '@worker/testing/cron/fixtures';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { runDocumentCapSweep } from '@worker/utils/document-cap-sweep/run-document-cap-sweep';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { GET } from './route';

const MOCK_SWEEP_URL = `${MOCK_WORKER_ORIGIN}/api/document-cap-sweep`;
const MOCK_SWEEP_RESULT = { checked: 3, nearing: 2, failed: 1 };

vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/document-cap-sweep/run-document-cap-sweep');

describe('GET /api/document-cap-sweep', () => {
  beforeEach(() => {
    mockEnv.CRON_SECRET = MOCK_CRON_SECRET;
    vi.mocked(runDocumentCapSweep).mockResolvedValue(MOCK_SWEEP_RESULT);
  });

  it('runs the sweep and answers with its counts', async () => {
    const response = await GET(cronRequest(MOCK_SWEEP_URL));

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual(MOCK_SWEEP_RESULT);
  });

  it('runs nothing for a request without the cron secret', async () => {
    const response = await GET(cronRequest(MOCK_SWEEP_URL, MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(runDocumentCapSweep).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the tenant list cannot be read', async () => {
    vi.mocked(runDocumentCapSweep).mockRejectedValue(new Error(MOCK_DB_DOWN));

    const response = await GET(cronRequest(MOCK_SWEEP_URL));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(DOCUMENT_CAP_LOG.SWEEP_FAILED, {
      error: MOCK_DB_DOWN,
    });
  });
});
