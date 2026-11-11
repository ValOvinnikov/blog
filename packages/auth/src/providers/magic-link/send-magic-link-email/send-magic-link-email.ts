import { applyTenantSenderName } from '@blog/auth/providers/magic-link/apply-tenant-sender-name/apply-tenant-sender-name';
import {
  findPendingInviteTenants,
  type TPendingInviteTenant,
} from '@blog/auth/providers/magic-link/find-pending-invite-tenants/find-pending-invite-tenants';
import { recordSignInSendSafely } from '@blog/auth/providers/magic-link/record-sign-in-send-safely/record-sign-in-send-safely';
import { resolveMagicLinkEmailSettings } from '@blog/auth/providers/magic-link/resolve-magic-link-email-settings/resolve-magic-link-email-settings';
import { resolveRecipientLocale } from '@blog/auth/providers/magic-link/resolve-recipient-locale/resolve-recipient-locale';
import { resolveTenantEmailIdentity } from '@blog/auth/providers/magic-link/resolve-tenant-email-identity/resolve-tenant-email-identity';
import {
  AUTH_APP,
  EMAIL_TEMPLATE_TYPE,
  type TAuthApp,
} from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants';
import {
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  buildSiteEmailTag,
  sendEmail,
} from '@blog/email';
import { hasLength } from '@blog/utils/primitives';

type TMagicLinkEmailRequest = {
  app: TAuthApp;
  from: string;
  identifier: string;
  url: string;
};

export async function sendMagicLinkEmail({
  app,
  from,
  identifier,
  url,
}: TMagicLinkEmailRequest): Promise<void> {
  const { host } = new URL(url);
  const isSentByPlatform = app === AUTH_APP.PLATFORM;
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

  if (readerSiteId) await recordSignInSendSafely(readerSiteId);
}

async function findPendingInviteTenantsOrNone(
  identifier: string,
): Promise<TPendingInviteTenant[]> {
  try {
    return await findPendingInviteTenants(identifier);
  } catch {
    // A failed lookup must not block delivery: it degrades to the generic copy.
    return [];
  }
}
