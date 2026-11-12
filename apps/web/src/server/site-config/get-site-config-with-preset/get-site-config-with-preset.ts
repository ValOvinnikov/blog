import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getSiteConfigWithPreset = async (
  failureEvent: string,
  tenant?: string,
) => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(failureEvent, { error: result.error });
  }

  const row = result.ok ? result.data : undefined;

  return { row, preset: PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE] };
};
