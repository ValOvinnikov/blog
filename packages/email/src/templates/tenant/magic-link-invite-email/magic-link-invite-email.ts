import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';
import type { TMagicLinkEmailContent } from '@blog/email/templates/tenant/magic-link-email/magic-link-email';
import { buildSignInEmailShell } from '@blog/email/templates/tenant/sign-in-email-shell/sign-in-email-shell';
import type { TTenantEmailIdentity } from '@blog/email/templates/tenant/tenant-email-identity/tenant-email-identity';

export type TMagicLinkInviteEmailInput = {
  url: string;
  tenantIdentity?: TTenantEmailIdentity;
  isSentByPlatform?: boolean;
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
 * Sign-in email for an address with a pending tenant invite. The invited
 * organisation name(s) and the accept-invite link render outside the authored
 * body, so no authored copy can remove, replace or displace them.
 */
export function buildInviteMagicLinkEmail({
  url,
  tenantIdentity,
  isSentByPlatform,
  tenantNames = [],
  subject,
  body,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  return {
    subject,
    html: buildSignInEmailShell({
      title: subject,
      bodyHtml: serializePortableText(body),
      structuralHtml: renderInvitedTenantNamesHtml(tenantNames),
      action: { label: ACCEPT_INVITE_ACTION_LABEL, url, variant: 'button' },
      tenantIdentity,
      isSentByPlatform,
      logoImageUrl,
      footerPostalAddress,
    }),
  };
}
