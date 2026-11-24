import { signIn } from '@platform/server/auth/auth';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { MAGIC_LINK_PROVIDER_ID } from '@shinefold/auth/providers/magic-link/magic-link-provider/magic-link-provider';

const AUTH_ERROR_PARAM = 'error';

type TMagicLinkEmailRequest = {
  email: string;
  redirectTo: string;
  failureEvent: string;
  logContext: Record<string, string>;
};

/** Never throws; resolves whether the email went out. */
export const sendMagicLinkEmail = async ({
  email,
  redirectTo,
  failureEvent,
  logContext,
}: TMagicLinkEmailRequest): Promise<boolean> => {
  try {
    const redirectUrl: string = await signIn(MAGIC_LINK_PROVIDER_ID, {
      email,
      redirect: false,
      redirectTo: toSafeCallbackPath(redirectTo),
    });
    const reason = new URL(redirectUrl).searchParams.get(AUTH_ERROR_PARAM);
    if (!reason) return true;

    logger.error(failureEvent, { ...logContext, reason });
  } catch (error) {
    logger.error(failureEvent, { ...logContext, ...toLoggableError(error) });
  }
  return false;
};
