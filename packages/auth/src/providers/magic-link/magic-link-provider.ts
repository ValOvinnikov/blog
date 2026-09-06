import { env } from '@blog/auth/utils/env/env';
import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import { sendEmail } from '@blog/email';
import type { EmailConfig } from 'next-auth/providers/email';

import { applyTenantSenderName } from './apply-tenant-sender-name';
import { findPendingInviteTenantNames } from './find-pending-invite-tenant-names';
import { buildMagicLinkEmail } from './magic-link-email';
import { buildInviteMagicLinkEmail } from './magic-link-invite-email';
import { resolveMagicLinkEmailSettings } from './resolve-magic-link-email-settings';
import { resolveMagicLinkFromAddress } from './resolve-magic-link-from-address';
import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

/**
 * Builds the Auth.js Email (magic-link) provider shared by both apps.
 */
export function buildMagicLinkProvider(): EmailConfig {
  const from = resolveMagicLinkFromAddress(env.MAGIC_LINK_FROM_ADDRESS);

  return {
    id: 'email',
    type: 'email',
    name: 'Email',
    from,
    async sendVerificationRequest({ identifier, url }) {
      const { host } = new URL(url);
      let tenantNames: string[] = [];
      try {
        tenantNames = await findPendingInviteTenantNames(identifier);
      } catch {
        // Best-effort: a failed lookup falls back to the generic copy below,
        // same as finding no pending invite — never blocks delivery of the
        // magic-link email itself. Never console.*, this package never logs
        // (see CLAUDE.md).
      }
      const tenantIdentity = await resolveTenantEmailIdentity(host);
      const isInvite = tenantNames.length > 0;
      const templateType = isInvite
        ? EMAIL_TEMPLATE_TYPE.TENANT_INVITE
        : EMAIL_TEMPLATE_TYPE.MAGIC_LINK;

      const emailSettings = tenantIdentity
        ? await resolveMagicLinkEmailSettings(
            tenantIdentity.tenantId,
            templateType,
          )
        : undefined;

      const { subject: resolvedSubject, body: resolvedBody } =
        emailSettings ?? EMAIL_TEMPLATE_DEFAULT_COPY[templateType];

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
