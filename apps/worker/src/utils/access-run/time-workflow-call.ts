import type { TMaybeUndefined } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import {
  type ACCESS_RUN_CALL,
  ACCESS_RUN_LOG,
} from '@worker/constants/access-run';
import { logger } from '@worker/utils/logger/logger';

export async function timeWorkflowCall<T>(
  call: TValueOf<typeof ACCESS_RUN_CALL>,
  context: Record<string, string>,
  run: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  let errorName: TMaybeUndefined<string>;
  logger.info(ACCESS_RUN_LOG.WORKFLOW_CALL_STARTED, { call, ...context });
  try {
    return await run();
  } catch (error) {
    errorName = error instanceof Error ? error.name : typeof error;
    throw error;
  } finally {
    logger.info(ACCESS_RUN_LOG.WORKFLOW_CALL_DONE, {
      call,
      ...context,
      errorName,
      durationMs: Date.now() - startedAt,
    });
  }
}
