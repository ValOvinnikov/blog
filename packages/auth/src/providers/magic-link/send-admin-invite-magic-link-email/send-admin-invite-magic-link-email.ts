import { recordMagicLinkSendSafely } from '@shinefold/auth/providers/magic-link/record-magic-link-send-safely/record-magic-link-send-safely';
import { EMAIL_ACCOUNT, EMAIL_TYPE } from '@shinefold/config/constants';
import type {
  IMagicLinkSendHandlers,
  TMaybeUndefined,
} from '@shinefold/config/types';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE, type TAdminRole } from '@shinefold/db/constants';
import type { TPendingAdminInviteWithInviter } from '@shinefold/db/queries/admin-invites/find-pending-admin-invite';
import {
  buildAdminInviteEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@shinefold/email';

const ADMIN_ROLE_LABEL: Record<TAdminRole, string> = {
  [ADMIN_ROLE.SUPERADMIN]: 'Super admin',
  [ADMIN_ROLE.ADMIN]: 'Admin',
  [ADMIN_ROLE.MODERATOR]: 'Moderator',
};

type TAdminInviteEmailRequest = {
  from: string;
  identifier: string;
  url: string;
  onSendCountFailed: IMagicLinkSendHandlers['onSendCountFailed'];
};

async function findPendingAdminInviteOrNone(
  identifier: string,
): Promise<TMaybeUndefined<TPendingAdminInviteWithInviter>> {
  try {
    return await queries.adminInvites.findPendingAdminInvite(identifier);
  } catch {
    return undefined;
  }
}

export async function sendPendingAdminInviteEmail({
  from,
  identifier,
  url,
  onSendCountFailed,
}: TAdminInviteEmailRequest): Promise<boolean> {
  const adminInvite = await findPendingAdminInviteOrNone(identifier);
  if (!adminInvite) return false;

  const { role, inviterName, inviterEmail } = adminInvite;
  const { subject, html, text } = buildAdminInviteEmail({
    inviterName:
      inviterName?.trim() || inviterEmail || PLATFORM_EMAIL_BRAND_NAME,
    roleLabel: ADMIN_ROLE_LABEL[role],
    url,
  });

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: identifier,
    from,
    subject,
    html,
    text,
  });
  await recordMagicLinkSendSafely(
    { emailType: EMAIL_TYPE.INVITE },
    onSendCountFailed,
  );

  return true;
}
