import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getLanguageSwitcherStyle = async (
  tenant?: string,
): Promise<TLanguageSwitcherStyle> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(SITE_CONFIG_LOG.LANGUAGE_SWITCHER_STYLE_FETCH_FAILED, {
      error: result.error,
    });
    return LANGUAGE_SWITCHER_STYLE.MENU_CODE;
  }

  return (
    result.data?.languageSwitcherStyle ?? LANGUAGE_SWITCHER_STYLE.MENU_CODE
  );
};
