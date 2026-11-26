import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';

export interface IBrandLogos {
  logoUrl?: string;
  darkLogoUrl?: string;
}

export const getBrandLogos = async (tenant?: string): Promise<IBrandLogos> => {
  const row = await getSiteConfigRow(
    SITE_CONFIG_LOG.BRAND_LOGO_FETCH_FAILED,
    tenant,
  );

  return { logoUrl: row?.logoAssetUrl, darkLogoUrl: row?.logoDarkAssetUrl };
};
