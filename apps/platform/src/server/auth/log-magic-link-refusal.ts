import type { IMagicLinkSendRefusal } from '@blog/config/types';
import { SIGN_IN_LOG } from '@platform/constants/sign-in';
import { logger } from '@platform/utils/logger/logger';

export const logMagicLinkRefusal = ({
  reason,
  error,
}: IMagicLinkSendRefusal): void => {
  logger.warn(SIGN_IN_LOG.LINK_REFUSED, { reason, error });
};
