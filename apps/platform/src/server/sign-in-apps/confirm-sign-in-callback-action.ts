'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
  type TSignInAppRefusal,
} from '@platform/constants/sign-in-apps';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import { requireSignInAppOwner } from './require-sign-in-app-owner';
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
  const { tenant } = await requireSignInAppOwner(tenantId);

  const parsed = signInAppProviderSchema.safeParse(provider);
  if (!parsed.success) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  const { id, primaryDomain, isArchived } = tenant;

  if (isArchived) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    };
  }

  try {
    await queries.tenantOAuthCredentials.confirmTenantOAuthCallbackDomain(
      id,
      parsed.data,
      primaryDomain,
    );
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SIGN_IN_APP_LOG.CONFIRM_CALLBACK_FAILED, {
      tenantId: id,
      provider: parsed.data,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
