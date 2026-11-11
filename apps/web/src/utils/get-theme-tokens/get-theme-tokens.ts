import type { TThemeTokens } from '@blog/config';
import { THEME_TOKENS_LOG } from '@web/constants/theme-tokens';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import { toThemeTokens } from '@web/utils/to-theme-tokens';

export const getThemeTokens = async (
  tenant?: string,
): Promise<TThemeTokens> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(THEME_TOKENS_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
    return toThemeTokens(undefined);
  }

  return toThemeTokens(result.data);
};
