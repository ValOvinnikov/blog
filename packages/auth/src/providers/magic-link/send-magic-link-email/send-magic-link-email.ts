import { findPendingInviteTenantsOrNone } from '@shinefold/auth/providers/magic-link/find-pending-invite-tenants/find-pending-invite-tenants';
import { recordMagicLinkSendSafely } from '@shinefold/auth/providers/magic-link/record-magic-link-send-safely/record-magic-link-send-safely';
import { resolveMagicLinkEmailSettings } from '@shinefold/auth/providers/magic-link/resolve-magic-link-email-settings/resolve-magic-link-email-settings';
import { resolveRecipientLocale } from '@shinefold/auth/providers/magic-link/resolve-recipient-locale/resolve-recipient-locale';
import { resolveTenantEmailIdentity } from '@shinefold/auth/providers/magic-link/resolve-tenant-email-identity/resolve-tenant-email-identity';
import { sendPendingAdminInviteEmail } from '@shinefold/auth/providers/magic-link/send-admin-invite-magic-link-email/send-admin-invite-magic-link-email';
import {
  AUTH_APP,
  EMAIL_ACCOUNT,
  EMAIL_TEMPLATE_TYPE,
  EMAIL_TYPE,
  type TAuthApp,
} from '@shinefold/config/constants';
import type { IMagicLinkSendHandlers } from '@shinefold/config/types';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@shinefold/db/constants';
import {
  applyTenantSenderName,
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  buildSiteEmailTag,
  sendEmail,
} from '@shinefold/email';
import { hasLength } from '@shinefold/utils/primitives';

type TMagicLinkEmailRequest = {
  app: TAuthApp;
  from: string;
  identifier: string;
  url: string;
  onSendCountFailed: IMagicLinkSendHandlers['onSendCountFailed'];
};

export async function sendMagicLinkEmail({
  app,
  from,
  identifier,
  url,
  onSendCountFailed,
}: TMagicLinkEmailRequest): Promise<void> {
  const isSentByPlatform = app === AUTH_APP.PLATFORM;
  if (
    isSentByPlatform &&
    (await sendPendingAdminInviteEmail({
      from,
      identifier,
      url,
      onSendCountFailed,
    }))
  ) {
    return;
  }

  const { host } = new URL(url);
  const inviteTenants = isSentByPlatform
    ? await findPendingInviteTenantsOrNone(identifier)
    : [];
  const tenantNames = inviteTenants.map(({ name }) => name);
  const tenantIdentity = await resolveTenantEmailIdentity(host);
  const readerSiteId = isSentByPlatform ? undefined : tenantIdentity?.tenantId;
  const isInvite = hasLength(tenantNames);
  const templateType = isInvite
    ? EMAIL_TEMPLATE_TYPE.TENANT_INVITE
    : EMAIL_TEMPLATE_TYPE.MAGIC_LINK;
  const locale = resolveRecipientLocale(url, tenantIdentity, inviteTenants);

  const emailSettings = tenantIdentity
    ? await resolveMagicLinkEmailSettings(
        tenantIdentity.tenantId,
        templateType,
        locale,
      )
    : undefined;

  const { subject: resolvedSubject, body: resolvedBody } =
    emailSettings ??
    EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][templateType];

  const { subject, html } = isInvite
    ? buildInviteMagicLinkEmail({
        url,
        tenantIdentity,
        isSentByPlatform,
        tenantNames,
        subject: resolvedSubject,
        body: resolvedBody,
        logoImageUrl: emailSettings?.logoImageUrl,
        footerPostalAddress: emailSettings?.footerPostalAddress,
      })
    : buildMagicLinkEmail({
        url,
        tenantIdentity,
        isSentByPlatform,
        subject: resolvedSubject,
        body: resolvedBody,
        logoImageUrl: emailSettings?.logoImageUrl,
        footerPostalAddress: emailSettings?.footerPostalAddress,
      });

  await sendEmail({
    account: isSentByPlatform ? EMAIL_ACCOUNT.PLATFORM : EMAIL_ACCOUNT.TENANT,
    to: identifier,
    from: applyTenantSenderName(
      from,
      emailSettings?.senderName?.trim() || tenantIdentity?.brandName,
    ),
    subject,
    html,
    replyTo: emailSettings?.replyTo,
    tags: readerSiteId ? [buildSiteEmailTag(readerSiteId)] : undefined,
  });

  if (isSentByPlatform || readerSiteId) {
    await recordMagicLinkSendSafely(
      {
        siteId: readerSiteId,
        emailType: isInvite ? EMAIL_TYPE.INVITE : EMAIL_TYPE.SIGN_IN,
      },
      onSendCountFailed,
    );
  }
}
