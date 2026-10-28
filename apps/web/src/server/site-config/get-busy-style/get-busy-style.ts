import {
  type IBusyStyle,
  PRESET_ID,
  PRESET_REGISTRY,
  toSpinnerVariant,
} from '@blog/config';
import { BUSY_STYLE_LOG } from '@web/constants/busy-style';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getBusyStyle = async (tenant?: string): Promise<IBusyStyle> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(BUSY_STYLE_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
  }

  const row = result.ok ? result.data : undefined;
  const presetId = row?.preset ?? PRESET_ID.CONSOLE;
  const preset = PRESET_REGISTRY[presetId];

  return {
    busyStyle: row?.busyButtonStyle ?? preset.busyButtonStyle,
    spinnerVariant: toSpinnerVariant(
      row?.spinnerStyle ?? preset.spinnerStyle,
      presetId,
    ),
  };
};
