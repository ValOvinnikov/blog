'use server';

import {
  ACTION_OUTCOME,
  SIGNUP_TERMS_COOKIE_NAME,
  TERMS_VERSION,
  type TActionResult,
} from '@blog/config';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_LOG,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { checkBotId } from 'botid/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Outlives a magic link, which Auth.js expires after a day.
const SIGNUP_TERMS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 2;

const acceptSignupTermsInputSchema = z.object({
  hasAcceptedTerms: z.literal(true),
});

export type TAcceptSignupTermsInput = {
  hasAcceptedTerms: boolean;
};

export type TAcceptSignupTermsResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED,
  keyof TAcceptSignupTermsInput,
  typeof SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED,
  typeof SIGN_UP_REFUSAL.TRY_AGAIN_LATER
>;

const isBotOrUnverified = async (): Promise<boolean> => {
  try {
    const { isBot } = await checkBotId({
      advancedOptions: { checkLevel: 'deepAnalysis' },
    });
    if (isBot) {
      logger.warn(SIGN_UP_LOG.BOT_REFUSED);
    }
    return isBot;
  } catch (error) {
    logger.error(SIGN_UP_LOG.BOT_CHECK_FAILED, { error });
    return true;
  }
};

export const acceptSignupTermsAction = async (
  input: TAcceptSignupTermsInput,
): Promise<TAcceptSignupTermsResult> => {
  if (!acceptSignupTermsInputSchema.safeParse(input).success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
      },
    };
  }

  if (await isBotOrUnverified()) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    };
  }

  (await cookies()).set(SIGNUP_TERMS_COOKIE_NAME, TERMS_VERSION, {
    maxAge: SIGNUP_TERMS_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect(adminRoutes.signIn(adminRoutes.home()));
};
