import type { TResult } from '@blog/utils';
import {
  REVALIDATE_LOG,
  WHOLE_SITE_PURGE_ARGS,
} from '@web/constants/revalidate';
import { logger } from '@web/utils/logger/logger';
import { revalidatePath } from 'next/cache';

export const purgeDerivedPaths = (
  derived: TResult<string[], string>,
  context: Record<string, unknown>,
): void => {
  if (derived.ok) {
    for (const path of derived.data) {
      revalidatePath(path);
    }
    return;
  }
  logger.warn(REVALIDATE_LOG.PATH_PURGE_FALLBACK, {
    ...context,
    reason: derived.error,
  });
  revalidatePath(...WHOLE_SITE_PURGE_ARGS);
};
