import type { TMaybeUndefined } from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';

type TBrandNameSource = {
  tenantId: TMaybeUndefined<string>;
  tenantName: TMaybeUndefined<string>;
};

export const getBrandName = async ({
  tenantId,
  tenantName,
}: TBrandNameSource): Promise<TMaybeUndefined<string>> => {
  if (!tenantId) return tenantName;

  const row = await getSiteConfigRow(
    SITE_CONFIG_LOG.BRAND_NAME_FETCH_FAILED,
    tenantId,
    { tenantId },
  );

  return row?.brandName ?? tenantName;
};
