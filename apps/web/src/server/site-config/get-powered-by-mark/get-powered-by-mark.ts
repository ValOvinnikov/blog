import type { TMaybeUndefined } from '@blog/config';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { FOOTER_LOG } from '@web/constants/footer';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

export const getPoweredByMark = async (
  tenant: string,
): Promise<TMaybeUndefined<string>> => {
  const plan = await getEffectivePlan(tenant);
  if (!PLAN_ENTITLEMENTS[plan].hasPoweredByMark) return undefined;

  const { MARKETING_SITE_URL: href } = env;
  if (!href) {
    logger.error(FOOTER_LOG.POWERED_BY_UNCONFIGURED);
    return undefined;
  }

  return href;
};
