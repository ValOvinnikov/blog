import { SIGNUP_TERMS_COOKIE_NAME, TERMS_VERSION } from '@blog/config';
import { SIGN_UP_LOG } from '@platform/constants/sign-up';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { checkBotId } from 'botid/server';
import { cookies } from 'next/headers';

// Outlives a magic link, which Auth.js expires after a day.
const SIGNUP_TERMS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 2;

const isBotOrUnverified = async (): Promise<boolean> => {
  try {
    const { isBot } = await checkBotId();
    if (isBot) {
      logger.warn(SIGN_UP_LOG.BOT_REFUSED);
    }
    return isBot;
  } catch (error) {
    logger.error(SIGN_UP_LOG.BOT_CHECK_FAILED, toLoggableError(error));
    return true;
  }
};

/** Marks the browser as agreeing to the current terms, which the sign-in event records on the new account; a bot gets no mark. */
export const setSignupTermsCookie = async (): Promise<void> => {
  if (await isBotOrUnverified()) return;

  (await cookies()).set(SIGNUP_TERMS_COOKIE_NAME, TERMS_VERSION, {
    maxAge: SIGNUP_TERMS_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    // eslint-disable-next-line blog-touched/prefer-shared-constant -- CLAUDE.md exempts an env comparison; the rule does not yet
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};
