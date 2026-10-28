'use server';

import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { MagicLinkSendLimitedError } from '@blog/auth/providers/magic-link/magic-link-send-limited-error/magic-link-send-limited-error';
import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { SIGN_IN_LOG } from '@platform/constants/sign-in';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { z } from 'zod';

import { signIn } from './auth';
import { setSignupTermsCookie } from './set-signup-terms-cookie';

const sendSignInLinkInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  callbackPath: z.string(),
  isSignUp: z.boolean().optional(),
});

export type TSendSignInLinkInput = z.input<typeof sendSignInLinkInputSchema>;

export type TSendSignInLinkFieldError = typeof TENANT_FIELD_ERROR.EMAIL_INVALID;

export type TSendSignInLinkRefusal =
  typeof ACTION_OUTCOME.RATE_LIMITED | typeof ACTION_OUTCOME.SERVER_ERROR;

export type TSendSignInLinkResult = TActionResult<
  TSendSignInLinkRefusal,
  keyof TSendSignInLinkInput,
  TSendSignInLinkFieldError
>;

export const sendSignInLinkAction = async (
  input: TSendSignInLinkInput,
): Promise<TSendSignInLinkResult> => {
  const parsed = sendSignInLinkInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toTenantFieldErrors<
        keyof TSendSignInLinkInput,
        TSendSignInLinkFieldError
      >(parsed.error.issues, { email: TENANT_FIELD_ERROR.EMAIL_INVALID }),
    };
  }

  const { email, callbackPath, isSignUp } = parsed.data;
  if (isSignUp) await setSignupTermsCookie();

  try {
    await signIn(MAGIC_LINK_PROVIDER_ID, {
      email,
      redirectTo: toSafeCallbackPath(callbackPath),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof MagicLinkSendLimitedError) {
      return toOutcome(ACTION_OUTCOME.RATE_LIMITED);
    }

    logger.error(SIGN_IN_LOG.LINK_FAILED, toLoggableError(error));
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
