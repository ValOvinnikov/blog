'use server';

import {
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
  type TSignInAppRefusal,
} from '@platform/constants/sign-in-apps';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TActionResult,
} from '@shinefold/config';
import type { TOAuthProvider } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { resolveWritableSignInApp } from './resolve-writable-sign-in-app';
import { signInAppProviderSchema } from './sign-in-app-input';

export type TRemoveSignInAppResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TSignInAppRefusal
>;

export const removeSignInAppAction = async (
  tenantId: string,
  provider: TOAuthProvider,
): Promise<TRemoveSignInAppResult> => {
  const resolved = await resolveWritableSignInApp(
    tenantId,
    signInAppProviderSchema,
    provider,
  );
  if (isOutcomeInvalid(resolved)) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  if (!isOutcomeSuccess(resolved)) return resolved;
  const {
    tenant: { id },
    input: parsedProvider,
  } = resolved;

  try {
    if (
      !(await queries.tenantOAuthCredentials.clearTenantOAuthCredentials(
        id,
        parsedProvider,
      ))
    ) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGN_IN_APP_REFUSAL.NO_SAVED_APP,
      };
    }

    await revalidateSiteConfig(id);
    await recordAuditEvent({
      logEvent: SIGN_IN_APP_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.OAUTH_APP_REMOVED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: id,
      details: { provider: parsedProvider },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SIGN_IN_APP_LOG.REMOVE_FAILED, {
      tenantId: id,
      provider: parsedProvider,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
