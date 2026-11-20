'use server';

import {
  SIGN_IN_APP_FIELD_ERROR,
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
  type TSignInAppFieldError,
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
import { queries } from '@shinefold/db';
import { hasLength } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { resolveWritableSignInApp } from './resolve-writable-sign-in-app';
import {
  signInAppInputSchema,
  type TSignInAppInput,
} from './sign-in-app-input';
import { writeSignInApp } from './write-sign-in-app';

export type TSaveSignInAppResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'clientId' | 'clientSecret',
  TSignInAppFieldError,
  TSignInAppRefusal
>;

const required = { reason: SIGN_IN_APP_FIELD_ERROR.REQUIRED };

export const saveSignInAppAction = async (
  tenantId: string,
  input: TSignInAppInput,
): Promise<TSaveSignInAppResult> => {
  const resolved = await resolveWritableSignInApp(
    tenantId,
    signInAppInputSchema,
    input,
  );
  if (isOutcomeInvalid(resolved)) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  if (!isOutcomeSuccess(resolved)) return resolved;
  const {
    tenant: { id, entitlements, primaryDomain },
    input: { provider, clientId, clientSecret },
  } = resolved;

  if (!entitlements.hasOwnOAuthApps) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.NOT_ON_PLAN,
    };
  }

  try {
    const clients =
      await queries.tenantOAuthCredentials.listTenantOAuthClients(id);
    const hasOwnApp = clients.some((client) => client.provider === provider);
    const fieldErrors = {
      ...(clientId ? {} : { clientId: required }),
      ...(clientSecret || hasOwnApp ? {} : { clientSecret: required }),
    };
    if (hasLength(Object.keys(fieldErrors))) {
      return { outcome: ACTION_OUTCOME.INVALID, fieldErrors };
    }

    const isWritten = await writeSignInApp(id, {
      provider,
      clientId,
      clientSecret,
      callbackDomain: primaryDomain,
    });
    if (!isWritten) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGN_IN_APP_REFUSAL.NO_SAVED_APP,
      };
    }

    await revalidateSiteConfig(id);
    await recordAuditEvent({
      logEvent: SIGN_IN_APP_LOG.SAVE_AUDIT_FAILED,
      action: hasOwnApp
        ? AUDIT_ACTION.OAUTH_APP_REPLACED
        : AUDIT_ACTION.OAUTH_APP_SAVED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: id,
      details: { provider, isSecretReplaced: Boolean(clientSecret) },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SIGN_IN_APP_LOG.SAVE_FAILED, {
      tenantId: id,
      provider,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
