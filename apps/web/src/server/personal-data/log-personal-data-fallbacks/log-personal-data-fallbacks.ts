import 'server-only';

import { PERSONAL_DATA_LOG } from '@blog/config/constants';
import { onPersonalDataFallback } from '@blog/db';
import { logger } from '@web/utils/logger/logger';

export const logPersonalDataFallbacks = (): void => {
  onPersonalDataFallback((fallback) => {
    logger.warn(PERSONAL_DATA_LOG.PLAIN_FALLBACK, fallback);
  });
};
