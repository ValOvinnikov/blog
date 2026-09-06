import { buildTenantShell } from '@blog/email';

import { escapeHtml } from './escape-html';
import type { TMagicLinkEmailContent } from './magic-link-email';
import type { TResolvedTenantEmailIdentity } from './resolve-tenant-email-identity';

export type TMagicLinkInviteEmailInput = {
  url: string;
  host: string;
  tenantNames: string[];
  /** The sending host's resolved tenant, if any — see `resolveTenantEmailIdentity`. */
  tenantIdentity?: TResolvedTenantEmailIdentity;
  /** The resolved tenant or per-template logo — see `resolveMagicLinkEmailSettings`. */
  logoImageUrl?: string;
  /** The tenant's configured footer postal address — see `resolveMagicLinkEmailSettings`. */
  footerPostalAddress?: string;
};

/**
 * Builds sign-in email copy for an address with one or more pending tenant invites.
 */
export function buildInviteMagicLinkEmail({
  url,
  host,
  tenantNames,
  tenantIdentity,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  const tenantList = formatTenantNames(tenantNames);
  const tenantListHtml = formatTenantNames(tenantNames.map(escapeHtml));

  const bodyHtml = [
    `<p>You've been invited to manage <strong>${tenantListHtml}</strong> on ${escapeHtml(host)}.</p>`,
    `<p><a href="${escapeHtml(url)}">Sign in to get started</a></p>`,
    `<p>If you did not expect this invite, you can safely ignore it.</p>`,
  ].join('');

  return {
    subject: `You've been invited to manage ${tenantList}`,
    html: tenantIdentity
      ? buildTenantShell({
          brand: tenantIdentity.brand,
          brandName: tenantIdentity.brandName,
          bodyHtml,
          logoImageUrl,
          footerPostalAddress,
        })
      : bodyHtml,
  };
}

function formatTenantNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
