import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';

export const getLanguageSwitcherStyle = async (
  tenant?: string,
): Promise<TLanguageSwitcherStyle> => {
  const row = await getSiteConfigRow(
    SITE_CONFIG_LOG.LANGUAGE_SWITCHER_STYLE_FETCH_FAILED,
    tenant,
  );

  return row?.languageSwitcherStyle ?? LANGUAGE_SWITCHER_STYLE.MENU_CODE;
};
