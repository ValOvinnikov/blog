import 'server-only';

import { SUPPORT_LOG } from '@platform/constants/support';
import { logger } from '@platform/utils/logger/logger';
import { supportEnv } from '@platform/utils/support-env/support-env';
import type { TMaybeUndefined } from '@shinefold/config';

let hasLoggedMissingAddress = false;

export const resolveSupportAddress = (): TMaybeUndefined<string> => {
  const address = supportEnv.SUPPORT_EMAIL_ADDRESS;
  if (!address && !hasLoggedMissingAddress) {
    hasLoggedMissingAddress = true;
    logger.warn(SUPPORT_LOG.ADDRESS_MISSING);
  }

  return address;
};
