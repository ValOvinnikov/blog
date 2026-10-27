import 'server-only';

import { queries } from '@blog/db';
import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import { takeCreateSiteSlot } from '@platform/server/create-site-gate/create-site-gate';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

type TAdmitCreateSiteInput = {
  clientKey: string;
  email: string;
  now?: Date;
};

const isEmailBlocked = async (email: string): Promise<boolean> => {
  try {
    const result = await queries.blockedSignupIdentities.isSignupBlocked(email);
    if (result.ok) return result.data;

    logger.error(CREATE_SITE_GATE_LOG.BLOCK_CHECK_FAILED, {
      errorCode: result.error,
    });
  } catch (error) {
    logger.error(
      CREATE_SITE_GATE_LOG.BLOCK_CHECK_FAILED,
      toLoggableError(error),
    );
  }

  return true;
};

export const admitCreateSite = async ({
  clientKey,
  email,
  now,
}: TAdmitCreateSiteInput): Promise<boolean> => {
  if (await isEmailBlocked(email)) {
    logger.warn(CREATE_SITE_GATE_LOG.BLOCKED);
    return false;
  }

  return takeCreateSiteSlot(clientKey, now);
};
