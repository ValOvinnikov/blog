import 'server-only';

import { queries } from '@blog/db';
import type { TSiteConfigSavedAt } from '@blog/db/constants';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

/** Best-effort: a lost stamp only delays a first-run checklist tick, so it never fails the save it follows. */
export const stampSavedAt = async (
  tenantId: string,
  savedAt: TSiteConfigSavedAt,
): Promise<void> => {
  try {
    await queries.siteConfig.stampSiteConfigSavedAt(tenantId, savedAt);
  } catch (error) {
    logger.error(SITE_CONFIG_LOG.SAVED_AT_STAMP_FAILED, {
      tenantId,
      savedAt,
      ...toLoggableError(error),
    });
  }
};
