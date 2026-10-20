import type { TMaybeUndefined } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getBrandLogoUrl = async (
  tenant?: string,
): Promise<TMaybeUndefined<string>> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('brand_logo.site_config_fetch_failed', {
      error: result.error,
    });
    return undefined;
  }

  return result.data?.logoAssetUrl;
};
