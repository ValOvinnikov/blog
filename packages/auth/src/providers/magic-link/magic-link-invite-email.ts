import type { TMagicLinkEmailContent } from './magic-link-email';

export type TMagicLinkInviteEmailInput = {
  url: string;
  host: string;
  tenantNames: string[];
};

/**
 * buildInviteMagicLinkEmail — sign-in copy for an address with one or more
 * pending tenant invites, swapped in by `magic-link-provider.ts`'s
 * `sendVerificationRequest` instead of `buildMagicLinkEmail`'s generic
 * copy. Pure for the same reason as `buildMagicLinkEmail` — testable
 * without mocking Auth.js or the email transport.
 */
export function buildInviteMagicLinkEmail({
  url,
  host,
  tenantNames,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  const tenantList = formatTenantNames(tenantNames);

  return {
    subject: `You've been invited to manage ${tenantList}`,
    html: [
      `<p>You've been invited to manage <strong>${tenantList}</strong> on ${host}.</p>`,
      `<p><a href="${url}">Sign in to get started</a></p>`,
      `<p>If you did not expect this invite, you can safely ignore it.</p>`,
    ].join(''),
  };
}

function formatTenantNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
