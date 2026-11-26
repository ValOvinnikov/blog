import type { TLogContext } from '@shinefold/insight';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getSiteConfigRow = async (
  failureEvent: string,
  tenant?: string,
  logContext?: TLogContext,
) => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(failureEvent, { ...logContext, error: result.error });
    return undefined;
  }

  return result.data;
};
