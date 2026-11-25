import {
  COLOR_MODE,
  COLOR_SCHEME,
  type TColorScheme,
  type TMaybeUndefined,
} from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getLockedColorScheme = async (
  tenant?: string,
): Promise<TMaybeUndefined<TColorScheme>> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(SITE_CONFIG_LOG.COLOR_MODE_FETCH_FAILED, {
      error: result.error,
    });
    return undefined;
  }

  switch (result.data?.colorMode) {
    case COLOR_MODE.LIGHT:
      return COLOR_SCHEME.LIGHT;
    case COLOR_MODE.DARK:
      return COLOR_SCHEME.DARK;
    default:
      return undefined;
  }
};
