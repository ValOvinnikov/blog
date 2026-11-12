import type { IFooterStyle } from '@blog/config';
import { FOOTER_LOG } from '@web/constants/footer';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export const getFooterStyle = async (
  tenant?: string,
): Promise<IFooterStyle> => {
  const { row, preset } = await getSiteConfigWithPreset(
    FOOTER_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    layout: row?.footerLayout ?? preset.footerLayout,
    background: row?.footerBackground ?? preset.footerBackground,
    surface: row?.footerSurface ?? preset.footerSurface,
    cookieSettingsButton:
      row?.cookieSettingsButton ?? preset.cookieSettingsButton,
  };
};
