import { HTTP_STATUS } from '@shinefold/config/constants';
import {
  CANARY_FAILURE,
  CANARY_LOG,
  CANARY_TIMEOUT_MS,
} from '@worker/constants/canary';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { bearerRequest } from '@worker/testing/bearer/fixtures';
import { freezeClock } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { createMockFaker } from '@worker/testing/mock-faker';
import {
  MOCK_QUEUE_DOWN,
  MOCK_WORKFLOW_CRASH,
} from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { runCanary } from '@worker/workflows/run-canary';
import { start } from 'workflow/api';

import { GET } from './route';

vi.mock('@worker/utils/env/env');
vi.mock('workflow/api');

const mockFaker = createMockFaker(7401);

const MOCK_CANARY_URL = `${MOCK_WORKER_ORIGIN}/api/canary`;
const MOCK_CANARY_SECRET = mockFaker.string.alphanumeric(32);
const MOCK_RUN_MS = mockFaker.number.int({
  min: 1,
  max: CANARY_TIMEOUT_MS - 1,
});

function never(): Promise<never> {
  return new Promise(() => {});
}

function startRun(returnValue: () => Promise<void>): void {
  vi.mocked(start).mockResolvedValue({
    runId: MOCK_RUN_ID,
    get returnValue() {
      return returnValue();
    },
  } as never);
}

async function canaryAfter(elapsedMs: number): Promise<Response> {
  const response = GET(bearerRequest(MOCK_CANARY_URL, MOCK_CANARY_SECRET));
  await vi.advanceTimersByTimeAsync(elapsedMs);
  return response;
}

describe('GET /api/canary', () => {
  beforeEach(() => {
    freezeClock();
    mockEnv.CANARY_SECRET = MOCK_CANARY_SECRET;
  });

  it('answers with the run id and duration once the run completes', async () => {
    startRun(() => new Promise((resolve) => setTimeout(resolve, MOCK_RUN_MS)));

    const response = await canaryAfter(MOCK_RUN_MS);

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual({
      runId: MOCK_RUN_ID,
      durationMs: MOCK_RUN_MS,
    });
    expect(start).toHaveBeenCalledWith(runCanary);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    ['a forged secret', bearerRequest(MOCK_CANARY_URL, MOCK_FORGED_SECRET)],
    ['no secret', new Request(MOCK_CANARY_URL)],
  ])('refuses a request with %s', async (_label, request) => {
    const response = await GET(request);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and refuses every request while the canary secret is unset', async () => {
    mockEnv.CANARY_SECRET = undefined;

    const response = await GET(
      bearerRequest(MOCK_CANARY_URL, MOCK_CANARY_SECRET),
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(CANARY_LOG.NOT_CONFIGURED);
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and answers unavailable when the run outlasts the wait', async () => {
    startRun(never);

    const response = await canaryAfter(CANARY_TIMEOUT_MS);

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    await expect(response.json()).resolves.toEqual({
      runId: MOCK_RUN_ID,
      reason: CANARY_FAILURE.TIMED_OUT,
    });
    expect(logger.error).toHaveBeenCalledWith(CANARY_LOG.FAILED, {
      runId: MOCK_RUN_ID,
      reason: CANARY_FAILURE.TIMED_OUT,
      error: undefined,
    });
  });

  it('answers unavailable without a run id when the start hangs', async () => {
    vi.mocked(start).mockReturnValue(never());

    const response = await canaryAfter(CANARY_TIMEOUT_MS);

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    await expect(response.json()).resolves.toEqual({
      runId: null,
      reason: CANARY_FAILURE.TIMED_OUT,
    });
  });

  it('logs why the run failed and answers unavailable', async () => {
    startRun(() => Promise.reject(new Error(MOCK_WORKFLOW_CRASH)));

    const response = await canaryAfter(0);

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    await expect(response.json()).resolves.toEqual({
      runId: MOCK_RUN_ID,
      reason: CANARY_FAILURE.RUN_FAILED,
    });
    expect(logger.error).toHaveBeenCalledWith(CANARY_LOG.FAILED, {
      runId: MOCK_RUN_ID,
      reason: CANARY_FAILURE.RUN_FAILED,
      error: MOCK_WORKFLOW_CRASH,
    });
  });

  it('logs why the start failed and answers unavailable without a run id', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await canaryAfter(0);

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    await expect(response.json()).resolves.toEqual({
      runId: null,
      reason: CANARY_FAILURE.START_FAILED,
    });
    expect(logger.error).toHaveBeenCalledWith(CANARY_LOG.FAILED, {
      runId: null,
      reason: CANARY_FAILURE.START_FAILED,
      error: MOCK_QUEUE_DOWN,
    });
  });
});
