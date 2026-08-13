import { env } from '@blog/auth/utils/env/env';
import type { EmailConfig } from 'next-auth/providers/email';

import { buildMagicLinkEmail } from './magic-link-email';
import { resolveMagicLinkFromAddress } from './resolve-magic-link-from-address';

export type TSendEmailInput = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

export type TSendEmail = (input: TSendEmailInput) => Promise<void>;

/**
 * buildMagicLinkProvider — the Auth.js Email (magic-link) provider, shared
 * unchanged by both apps. Delivery is injected via `sendEmail` rather than
 * owned here: this package's dependency contract has no room for an email
 * SDK, so each app supplies its own already-configured sender.
 *
 * Hand-rolled `EmailConfig`, not `next-auth/providers/nodemailer`'s
 * `Nodemailer` factory — that factory's runtime module unconditionally
 * imports `nodemailer`, so a bundler resolves it at build time regardless of
 * whether it's ever used, requiring a dependency this package otherwise has
 * no reason to carry.
 */
export function buildMagicLinkProvider(sendEmail: TSendEmail): EmailConfig {
  const from = resolveMagicLinkFromAddress(env.MAGIC_LINK_FROM_ADDRESS);

  return {
    id: 'email',
    type: 'email',
    name: 'Email',
    from,
    async sendVerificationRequest({ identifier, url }) {
      const { host } = new URL(url);
      const { subject, html } = buildMagicLinkEmail({ url, host });

      await sendEmail({ to: identifier, from, subject, html });
    },
  };
}
