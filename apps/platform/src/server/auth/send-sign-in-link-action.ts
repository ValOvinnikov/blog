'use server';

import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { logger } from '@platform/utils/logger/logger';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { z } from 'zod';

import { signIn } from './auth';

const sendSignInLinkInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  callbackPath: z.string(),
});

export type TSendSignInLinkInput = z.input<typeof sendSignInLinkInputSchema>;

export type TSendSignInLinkFieldError = typeof TENANT_FIELD_ERROR.EMAIL_INVALID;

export type TSendSignInLinkResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
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

  const { email, callbackPath } = parsed.data;
  try {
    await signIn(MAGIC_LINK_PROVIDER_ID, {
      email,
      redirectTo: toSafeCallbackPath(callbackPath),
      redirect: false,
    });
  } catch (error) {
    logger.error('auth.sign_in_link_failed', { error });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
