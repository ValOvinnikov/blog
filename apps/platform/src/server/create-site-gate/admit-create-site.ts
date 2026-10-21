import 'server-only';

import { queries } from '@blog/db';
import { takeCreateSiteSlot } from '@platform/server/create-site-gate/create-site-gate';
import { logger } from '@platform/utils/logger/logger';

const BLOCK_CHECK_FAILED_EVENT = 'create_site_gate.block_check_failed';

type TAdmitCreateSiteInput = {
  clientKey: string;
  email: string;
  now?: Date;
};

const isEmailBlocked = async (email: string): Promise<boolean> => {
  try {
    const result = await queries.blockedSignupIdentities.isSignupBlocked(email);
    if (result.ok) return result.data;

    logger.error(BLOCK_CHECK_FAILED_EVENT, {
      error: result.error,
    });
  } catch (error) {
    logger.error(BLOCK_CHECK_FAILED_EVENT, { error });
  }

  return true;
};

export const admitCreateSite = async ({
  clientKey,
  email,
  now,
}: TAdmitCreateSiteInput): Promise<boolean> => {
  if (await isEmailBlocked(email)) {
    logger.warn('create_site_gate.blocked');
    return false;
  }

  return takeCreateSiteSlot(clientKey, now);
};
