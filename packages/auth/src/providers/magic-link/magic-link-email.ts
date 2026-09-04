import { buildTenantShell } from '@blog/email';

import { escapeHtml } from './escape-html';
import type { TResolvedTenantEmailIdentity } from './resolve-tenant-email-identity';

export type TMagicLinkEmailInput = {
  url: string;
  host: string;
  /** The sending host's resolved tenant, if any — see `resolveTenantEmailIdentity`. */
  tenantIdentity?: TResolvedTenantEmailIdentity;
};

export type TMagicLinkEmailContent = {
  subject: string;
  html: string;
};

/**
 * Builds the sign-in email's subject and HTML body for the Auth.js Email provider.
 */
export function buildMagicLinkEmail({
  url,
  host,
  tenantIdentity,
}: TMagicLinkEmailInput): TMagicLinkEmailContent {
  const escapedHost = escapeHtml(host);
  const escapedUrl = escapeHtml(url);

  const bodyHtml = [
    `<p>Click the link below to sign in to ${escapedHost}.</p>`,
    `<p><a href="${escapedUrl}">Sign in to ${escapedHost}</a></p>`,
    `<p>If you did not request this email, you can safely ignore it.</p>`,
  ].join('');

  return {
    subject: `Sign in to ${host}`,
    html: tenantIdentity
      ? buildTenantShell({
          brand: tenantIdentity.brand,
          brandName: tenantIdentity.brandName,
          bodyHtml,
        })
      : bodyHtml,
  };
}
