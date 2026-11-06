import type { TMaybeUndefined } from '@blog/config';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { FOOTER_LOG } from '@web/constants/footer';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

export type TPoweredByMark = {
  productName: string;
  href: string;
};

export const getPoweredByMark = async (
  tenant: string,
): Promise<TMaybeUndefined<TPoweredByMark>> => {
  const plan = await getEffectivePlan(tenant);
  if (!PLAN_ENTITLEMENTS[plan].hasPoweredByMark) return undefined;

  const { PRODUCT_NAME: productName, MARKETING_SITE_URL: href } = env;
  if (!productName || !href) {
    logger.error(FOOTER_LOG.POWERED_BY_UNCONFIGURED, {
      hasProductName: Boolean(productName),
      hasMarketingSiteUrl: Boolean(href),
    });
    return undefined;
  }

  return { productName, href };
};
