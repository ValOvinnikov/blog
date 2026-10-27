import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { TENANT_LOG } from '@platform/constants/tenant';
import { signIn } from '@platform/server/auth/auth';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

const AUTH_ERROR_PARAM = 'error';

export const sendOwnerInviteEmail = async (
  tenantId: string,
  ownerEmail: string,
): Promise<void> => {
  try {
    const redirectUrl: string = await signIn(MAGIC_LINK_PROVIDER_ID, {
      email: ownerEmail,
      redirect: false,
    });
    const reason = new URL(redirectUrl).searchParams.get(AUTH_ERROR_PARAM);
    if (reason) {
      logger.error(TENANT_LOG.OWNER_INVITE_EMAIL_FAILED, { tenantId, reason });
    }
  } catch (error) {
    logger.error(TENANT_LOG.OWNER_INVITE_EMAIL_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
  }
};
