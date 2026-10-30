import { PRESET_ID, PRESET_REGISTRY, type IFooterStyle } from '@blog/config';
import { FOOTER_LOG } from '@web/constants/footer';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getFooterStyle = async (
  tenant?: string,
): Promise<IFooterStyle> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(FOOTER_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
  }

  const row = result.ok ? result.data : undefined;
  const preset = PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE];

  return {
    layout: row?.footerLayout ?? preset.footerLayout,
    background: row?.footerBackground ?? preset.footerBackground,
    surface: row?.footerSurface ?? preset.footerSurface,
    cookieSettingsButton:
      row?.cookieSettingsButton ?? preset.cookieSettingsButton,
  };
};
