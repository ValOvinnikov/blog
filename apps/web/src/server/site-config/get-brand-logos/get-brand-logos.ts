import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export interface IBrandLogos {
  logoUrl?: string;
  darkLogoUrl?: string;
}

export const getBrandLogos = async (tenant?: string): Promise<IBrandLogos> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(SITE_CONFIG_LOG.BRAND_LOGO_FETCH_FAILED, {
      error: result.error,
    });
    return {};
  }

  return {
    logoUrl: result.data?.logoAssetUrl,
    darkLogoUrl: result.data?.logoDarkAssetUrl,
  };
};
