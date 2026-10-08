import { env } from '@blog/auth/utils/env/env';
import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants';
import {
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  sendEmail,
} from '@blog/email';
import type { EmailConfig } from 'next-auth/providers/email';

import { applyTenantSenderName } from './apply-tenant-sender-name';
import {
  findPendingInviteTenants,
  type TPendingInviteTenant,
} from './find-pending-invite-tenants';
import { readRecipientLocale } from './read-recipient-locale';
import { resolveMagicLinkEmailSettings } from './resolve-magic-link-email-settings';
import { resolveMagicLinkFromAddress } from './resolve-magic-link-from-address';
import {
  resolveTenantEmailIdentity,
  type TResolvedTenantEmailIdentity,
} from './resolve-tenant-email-identity';

export function buildMagicLinkProvider(): EmailConfig {
  const from = resolveMagicLinkFromAddress(env.MAGIC_LINK_FROM_ADDRESS);

  return {
    id: 'email',
    type: 'email',
    name: 'Email',
    from,
    async sendVerificationRequest({ identifier, url }) {
      const { host } = new URL(url);
      let inviteTenants: TPendingInviteTenant[] = [];
      try {
        inviteTenants = await findPendingInviteTenants(identifier);
      } catch {
        // A failed lookup must not block delivery: it degrades to the
        // generic copy, the same as finding no pending invite.
      }
      const tenantNames = inviteTenants.map(({ name }) => name);
      const tenantIdentity = await resolveTenantEmailIdentity(host);
      const isInvite = tenantNames.length > 0;
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
            tenantNames,
            subject: resolvedSubject,
            body: resolvedBody,
            logoImageUrl: emailSettings?.logoImageUrl,
            footerPostalAddress: emailSettings?.footerPostalAddress,
          })
        : buildMagicLinkEmail({
            url,
            tenantIdentity,
            subject: resolvedSubject,
            body: resolvedBody,
            logoImageUrl: emailSettings?.logoImageUrl,
            footerPostalAddress: emailSettings?.footerPostalAddress,
          });

      await sendEmail({
        to: identifier,
        from: applyTenantSenderName(from, emailSettings?.senderName),
        subject,
        html,
        replyTo: emailSettings?.replyTo,
      });
    },
  };
}

// With no tenant behind the host, an invite is written in the invited
// tenant's default language, and a platform admin's own sign-in stays in
// English.
function resolveRecipientLocale(
  url: string,
  tenantIdentity: TResolvedTenantEmailIdentity | undefined,
  inviteTenants: TPendingInviteTenant[],
): TLocaleIsoCode {
  if (tenantIdentity) {
    return readRecipientLocale(
      url,
      tenantIdentity.liveLocales,
      tenantIdentity.defaultLocale,
    );
  }

  return inviteTenants[0]?.locale ?? LOCALE_ISO_CODES.EN;
}
