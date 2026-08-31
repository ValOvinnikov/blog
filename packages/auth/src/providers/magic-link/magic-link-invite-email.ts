import { escapeHtml } from './escape-html';
import type { TMagicLinkEmailContent } from './magic-link-email';

export type TMagicLinkInviteEmailInput = {
  url: string;
  host: string;
  tenantNames: string[];
};

/**
 * Builds sign-in email copy for an address with one or more pending tenant invites.
 */
export function buildInviteMagicLinkEmail({
  url,
  host,
  tenantNames,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  const tenantList = formatTenantNames(tenantNames);
  const tenantListHtml = formatTenantNames(tenantNames.map(escapeHtml));

  return {
    subject: `You've been invited to manage ${tenantList}`,
    html: [
      `<p>You've been invited to manage <strong>${tenantListHtml}</strong> on ${escapeHtml(host)}.</p>`,
      `<p><a href="${escapeHtml(url)}">Sign in to get started</a></p>`,
      `<p>If you did not expect this invite, you can safely ignore it.</p>`,
    ].join(''),
  };
}

function formatTenantNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
