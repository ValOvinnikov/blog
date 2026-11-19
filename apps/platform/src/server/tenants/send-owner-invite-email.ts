import { TENANT_LOG } from '@platform/constants/tenant';
import { signIn } from '@platform/server/auth/auth';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { MAGIC_LINK_PROVIDER_ID } from '@shinefold/auth/providers/magic-link/magic-link-provider/magic-link-provider';

const AUTH_ERROR_PARAM = 'error';

/** Never throws: resolves whether the magic-link email went out, logging `failureEvent` when it did not. */
export const sendOwnerInviteEmail = async (
  tenantId: string,
  email: string,
  failureEvent: string = TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
): Promise<boolean> => {
  try {
    const redirectUrl: string = await signIn(MAGIC_LINK_PROVIDER_ID, {
      email,
      redirect: false,
      redirectTo: toSafeCallbackPath(
        adminRoutes.dashboardSelectTenantHref(tenantId),
      ),
    });
    const reason = new URL(redirectUrl).searchParams.get(AUTH_ERROR_PARAM);
    if (!reason) return true;

    logger.error(failureEvent, { tenantId, reason });
  } catch (error) {
    logger.error(failureEvent, { tenantId, ...toLoggableError(error) });
  }
  return false;
};
