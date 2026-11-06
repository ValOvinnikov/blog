'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
  type TSignInAppRefusal,
} from '@platform/constants/sign-in-apps';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

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
  const { tenant } = await requireTenantOwner(tenantId);

  const parsed = signInAppProviderSchema.safeParse(provider);
  if (!parsed.success) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  const { id, deprovisionedAt } = tenant;

  if (deprovisionedAt) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    };
  }

  try {
    if (
      !(await queries.tenantOAuthCredentials.clearTenantOAuthCredentials(
        id,
        parsed.data,
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
      details: { provider: parsed.data },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SIGN_IN_APP_LOG.REMOVE_FAILED, {
      tenantId: id,
      provider: parsed.data,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
