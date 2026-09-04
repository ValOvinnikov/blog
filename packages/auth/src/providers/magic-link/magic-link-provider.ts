import { env } from '@blog/auth/utils/env/env';
import { sendEmail } from '@blog/email';
import type { EmailConfig } from 'next-auth/providers/email';

import { findPendingInviteTenantNames } from './find-pending-invite-tenant-names';
import { buildMagicLinkEmail } from './magic-link-email';
import { buildInviteMagicLinkEmail } from './magic-link-invite-email';
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

      const { subject, html } =
        tenantNames.length > 0
          ? buildInviteMagicLinkEmail({
              url,
              host,
              tenantNames,
              tenantIdentity,
            })
          : buildMagicLinkEmail({ url, host, tenantIdentity });

      await sendEmail({ to: identifier, from, subject, html });
    },
  };
}
