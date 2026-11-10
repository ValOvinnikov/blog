import type { TValueOf } from '@blog/config';
import type { TResult } from '@blog/utils';
import type { SITEMAP_LOG } from '@web/constants/sitemap';
import { logger } from '@web/utils/logger/logger';

export const toListOrEmpty = <T>(
  result: TResult<T[]>,
  logEvent: TValueOf<typeof SITEMAP_LOG>,
): T[] => {
  if (result.ok) {
    return result.data;
  }
  logger.error(logEvent, { error: result.error });
  return [];
};
