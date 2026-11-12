import type { IHeaderStyle } from '@blog/config';
import { HEADER_STYLE_LOG } from '@web/constants/header-style';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export const getHeaderStyle = async (
  tenant?: string,
): Promise<IHeaderStyle> => {
  const { row, preset } = await getSiteConfigWithPreset(
    HEADER_STYLE_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    layout: row?.headerLayout ?? preset.headerLayout,
    submenuStyle: row?.headerSubmenuStyle ?? preset.headerSubmenuStyle,
    barStyle: row?.headerBarStyle ?? preset.headerBarStyle,
  };
};
