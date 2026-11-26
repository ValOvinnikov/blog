import {
  COLOR_MODE,
  COLOR_SCHEME,
  type TColorScheme,
  type TMaybeUndefined,
} from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';

export const getLockedColorScheme = async (
  tenant?: string,
): Promise<TMaybeUndefined<TColorScheme>> => {
  const row = await getSiteConfigRow(
    SITE_CONFIG_LOG.COLOR_MODE_FETCH_FAILED,
    tenant,
  );

  switch (row?.colorMode) {
    case COLOR_MODE.LIGHT:
      return COLOR_SCHEME.LIGHT;
    case COLOR_MODE.DARK:
      return COLOR_SCHEME.DARK;
    default:
      return undefined;
  }
};
