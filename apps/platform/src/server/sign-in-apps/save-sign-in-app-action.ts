'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { hasLength } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SIGN_IN_APP_FIELD_ERROR,
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
  type TSignInAppFieldError,
  type TSignInAppRefusal,
} from '@platform/constants/sign-in-apps';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

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
  const { tenant } = await requireTenantOwner(tenantId);

  const parsed = signInAppInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  const { provider, clientId, clientSecret } = parsed.data;
  const { id, plan, primaryDomain, deprovisionedAt } = tenant;

  if (deprovisionedAt) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    };
  }
  if (!PLAN_ENTITLEMENTS[plan].hasOwnOAuthApps) {
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
