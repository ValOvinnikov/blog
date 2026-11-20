'use server';

import {
  SIGN_IN_APP_LOG,
  type TSignInAppRefusal,
} from '@platform/constants/sign-in-apps';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TActionResult,
} from '@shinefold/config';
import type { TOAuthProvider } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { resolveWritableSignInApp } from './resolve-writable-sign-in-app';
import { signInAppProviderSchema } from './sign-in-app-input';

export type TConfirmSignInCallbackResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TSignInAppRefusal
>;

export const confirmSignInCallbackAction = async (
  tenantId: string,
  provider: TOAuthProvider,
): Promise<TConfirmSignInCallbackResult> => {
  const resolved = await resolveWritableSignInApp(
    tenantId,
    signInAppProviderSchema,
    provider,
  );
  if (isOutcomeInvalid(resolved)) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  if (!isOutcomeSuccess(resolved)) return resolved;
  const {
    tenant: { id, primaryDomain },
    input: parsedProvider,
  } = resolved;

  try {
    await queries.tenantOAuthCredentials.confirmTenantOAuthCallbackDomain(
      id,
      parsedProvider,
      primaryDomain,
    );
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SIGN_IN_APP_LOG.CONFIRM_CALLBACK_FAILED, {
      tenantId: id,
      provider: parsedProvider,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
