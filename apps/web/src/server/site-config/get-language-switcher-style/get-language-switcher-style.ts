import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getLanguageSwitcherStyle = async (
  tenant?: string,
): Promise<TLanguageSwitcherStyle> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('language_switcher_style.site_config_fetch_failed', {
      error: result.error,
    });
    return LANGUAGE_SWITCHER_STYLE.MENU_CODE;
  }

  return (
    result.data?.languageSwitcherStyle ?? LANGUAGE_SWITCHER_STYLE.MENU_CODE
  );
};
