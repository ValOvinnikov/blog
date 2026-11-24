import type { TValueOf } from '@shinefold/config/utils';
import {
  OWNER_ACCESS_LOG,
  type OWNER_ACCESS_SWEEP_STEP,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';

export async function runSweepStep<T>(
  step: TValueOf<typeof OWNER_ACCESS_SWEEP_STEP>,
  context: Record<string, string>,
  run: () => Promise<T>,
  describeResult: (value: T) => Record<string, number> = () => ({}),
): Promise<T> {
  const startedAt = Date.now();
  const value = await run();
  logger.info(OWNER_ACCESS_LOG.SWEEP_STEP_DONE, {
    step,
    ...context,
    ...describeResult(value),
    durationMs: Date.now() - startedAt,
  });
  return value;
}
