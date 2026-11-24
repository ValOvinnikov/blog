import { TENANT_LOG } from '@platform/constants/tenant';
import { sendMagicLinkEmail } from '@platform/server/auth/send-magic-link-email';
import { adminRoutes } from '@platform/utils/routes/routes';

export const sendOwnerInviteEmail = (
  tenantId: string,
  email: string,
  failureEvent: string = TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
): Promise<boolean> =>
  sendMagicLinkEmail({
    email,
    redirectTo: adminRoutes.dashboardSelectTenantHref(tenantId),
    failureEvent,
    logContext: { tenantId },
  });
