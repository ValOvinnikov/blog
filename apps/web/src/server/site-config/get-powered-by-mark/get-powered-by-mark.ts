import type { TMaybeUndefined } from '@shinefold/config';
import { FOOTER_LOG } from '@web/constants/footer';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

export const getPoweredByMark = async (
  tenant: string,
): Promise<TMaybeUndefined<string>> => {
  const { hasPoweredByMark } = await getEffectiveEntitlements(tenant);
  if (!hasPoweredByMark) return undefined;

  const { MARKETING_SITE_URL: href } = env;
  if (!href) {
    logger.error(FOOTER_LOG.POWERED_BY_UNCONFIGURED);
    return undefined;
  }

  return href;
};
