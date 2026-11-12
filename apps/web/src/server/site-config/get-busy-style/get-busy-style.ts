import type { IBusyStyle } from '@blog/config';
import { BUSY_STYLE_LOG } from '@web/constants/busy-style';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export const getBusyStyle = async (tenant?: string): Promise<IBusyStyle> => {
  const { row, preset } = await getSiteConfigWithPreset(
    BUSY_STYLE_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    busyStyle: row?.busyButtonStyle ?? preset.busyButtonStyle,
    spinnerVariant: row?.spinnerStyle ?? preset.spinnerStyle,
  };
};
