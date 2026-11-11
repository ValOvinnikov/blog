import type { TMaybeUndefined } from '@blog/config';
import type { TResult } from '@blog/utils';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

/**
 * A failed load throws to the error boundary (500) so a crawler retries it;
 * only a missing document answers 404.
 */
export const guardPageLoaderResult = <T>(
  result: TResult<TMaybeUndefined<T>>,
  logEventName: string,
  context?: Record<string, unknown>,
): T => {
  if (!result.ok) {
    logger.error(logEventName, { ...context, error: result.error });
    throw result.error;
  }

  if (!result.data) {
    notFound();
  }

  return result.data;
};
