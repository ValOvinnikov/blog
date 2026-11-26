import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';

export const getSiteConfigWithPreset = async (
  failureEvent: string,
  tenant?: string,
) => {
  const row = await getSiteConfigRow(failureEvent, tenant);

  return { row, preset: PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE] };
};
