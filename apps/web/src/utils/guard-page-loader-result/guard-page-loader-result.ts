import type { TResult } from '@blog/utils';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

/**
 * Applies the page-loader three-way guard (SPEC.md §17) shared by every
 * `pages/` composition that reads a nullable `service.pages.*` loader: a
 * genuine failure logs `logEventName` then 404s, a `data: undefined`
 * "no document matched that slug" 404s silently, and otherwise the narrowed,
 * non-undefined `result.data` is returned for the caller to destructure.
 */
export const guardPageLoaderResult = <T>(
  result: TResult<T | undefined>,
  logEventName: string,
  context?: Record<string, unknown>,
): T => {
  if (!result.ok) {
    logger.error(logEventName, { ...context, error: result.error });
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  return result.data;
};
