import {
  buildTenantShell,
  renderEmailAction,
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email';

import { escapeHtml } from './escape-html';
import type { TMagicLinkEmailContent } from './magic-link-email';
import type { TResolvedTenantEmailIdentity } from './resolve-tenant-email-identity';

export type TMagicLinkInviteEmailInput = {
  url: string;
  tenantIdentity?: TResolvedTenantEmailIdentity;
  tenantNames?: string[];
  subject: string;
  body: TPortableTextContent;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

const ACCEPT_INVITE_ACTION_LABEL = 'Accept invite';

function formatTenantNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function renderInvitedTenantNamesHtml(tenantNames: string[]): string {
  if (tenantNames.length === 0) return '';

  const names = formatTenantNames(tenantNames.map(escapeHtml));
  return `<p>You've been invited to manage <strong>${names}</strong>.</p>`;
}

/**
 * Builds sign-in email copy for an address with a pending tenant invite. The
 * invited organisation name(s) and the accept-invite link are both rendered
 * as locked structural elements outside the authored body, so no authored
 * copy can remove, replace or displace them.
 */
export function buildInviteMagicLinkEmail({
  url,
  tenantIdentity,
  tenantNames = [],
  subject,
  body,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  const bodyHtml = serializePortableText(body);
  const tenantNamesHtml = renderInvitedTenantNamesHtml(tenantNames);

  if (!tenantIdentity) {
    return {
      subject,
      html: `${tenantNamesHtml}${bodyHtml}<p><a href="${escapeHtml(url)}">${ACCEPT_INVITE_ACTION_LABEL}</a></p>`,
    };
  }

  const actionHtml = renderEmailAction(
    { label: ACCEPT_INVITE_ACTION_LABEL, url, variant: 'button' },
    tenantIdentity.brand,
  );

  return {
    subject,
    html: buildTenantShell({
      brand: tenantIdentity.brand,
      brandName: tenantIdentity.brandName,
      bodyHtml,
      structuralHtml: tenantNamesHtml,
      actionHtml,
      logoImageUrl,
      footerPostalAddress,
    }),
  };
}
