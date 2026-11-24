import { ACCESS_RUN_CALL, ACCESS_RUN_LOG } from '@worker/constants/access-run';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { timeWorkflowCall } from './time-workflow-call';

const MOCK_CONTEXT = { runId: MOCK_RUN_ID };

describe(timeWorkflowCall, () => {
  it('returns the call result between a started and a done line', async () => {
    const result = await timeWorkflowCall(
      ACCESS_RUN_CALL.RUN_STATUS,
      MOCK_CONTEXT,
      () => Promise.resolve(MOCK_RUN_ID),
    );

    expect(result).toBe(MOCK_RUN_ID);
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      ACCESS_RUN_LOG.WORKFLOW_CALL_STARTED,
      { call: ACCESS_RUN_CALL.RUN_STATUS, ...MOCK_CONTEXT },
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      ACCESS_RUN_LOG.WORKFLOW_CALL_DONE,
      expect.objectContaining({
        call: ACCESS_RUN_CALL.RUN_STATUS,
        ...MOCK_CONTEXT,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('rethrows the same error and names it on the done line', async () => {
    const failure = new TypeError(MOCK_QUEUE_DOWN);

    await expect(
      timeWorkflowCall(ACCESS_RUN_CALL.RUN_CANCEL, MOCK_CONTEXT, () =>
        Promise.reject(failure),
      ),
    ).rejects.toBe(failure);

    expect(logger.info).toHaveBeenLastCalledWith(
      ACCESS_RUN_LOG.WORKFLOW_CALL_DONE,
      expect.objectContaining({ errorName: failure.name }),
    );
  });

  it('logs only the started line while the call is still pending', async () => {
    void timeWorkflowCall(
      ACCESS_RUN_CALL.RESUME_HOOK,
      MOCK_CONTEXT,
      () => new Promise<never>(() => {}),
    );

    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      ACCESS_RUN_LOG.WORKFLOW_CALL_STARTED,
      { call: ACCESS_RUN_CALL.RESUME_HOOK, ...MOCK_CONTEXT },
    );
  });
});
