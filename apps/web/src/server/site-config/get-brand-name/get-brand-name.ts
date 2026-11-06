import type { TMaybeUndefined } from '@blog/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

type TBrandNameSource = {
  tenantId: TMaybeUndefined<string>;
  tenantName: TMaybeUndefined<string>;
};

export const getBrandName = async ({
  tenantId,
  tenantName,
}: TBrandNameSource): Promise<TMaybeUndefined<string>> => {
  if (!tenantId) return tenantName;

  const result = await getSiteConfig(tenantId);

  if (!result.ok) {
    logger.error(SITE_CONFIG_LOG.BRAND_NAME_FETCH_FAILED, {
      tenantId,
      error: result.error,
    });
    return tenantName;
  }

  return result.data?.brandName ?? tenantName;
};
