import type { IMagicLinkSendRefusal } from '@blog/config/types';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { logger } from '@web/utils/logger/logger';

export const logMagicLinkRefusal = ({
  reason,
  errorName,
  errorCode,
}: IMagicLinkSendRefusal): void => {
  logger.warn(SIGN_IN_LOG.LINK_REFUSED, { reason, errorName, errorCode });
};
