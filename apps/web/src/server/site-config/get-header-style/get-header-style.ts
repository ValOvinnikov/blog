import { PRESET_ID, PRESET_REGISTRY, type IHeaderStyle } from '@blog/config';
import { HEADER_STYLE_LOG } from '@web/constants/header-style';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getHeaderStyle = async (
  tenant?: string,
): Promise<IHeaderStyle> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(HEADER_STYLE_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
  }

  const row = result.ok ? result.data : undefined;
  const preset = PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE];

  return {
    layout: row?.headerLayout ?? preset.headerLayout,
    submenuStyle: row?.headerSubmenuStyle ?? preset.headerSubmenuStyle,
    barStyle: row?.headerBarStyle ?? preset.headerBarStyle,
  };
};
