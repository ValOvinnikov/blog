import type { TBrandVariant } from '@shinefold/config';
import { BAR_BACKGROUNDS_LOG } from '@web/constants/bar-backgrounds';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export type TBarBackgrounds = {
  breadcrumb: TBrandVariant;
};

export const getBarBackgrounds = async (
  tenant?: string,
): Promise<TBarBackgrounds> => {
  const { row, preset } = await getSiteConfigWithPreset(
    BAR_BACKGROUNDS_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    breadcrumb: row?.breadcrumbBackground ?? preset.breadcrumbBackground,
  };
};
