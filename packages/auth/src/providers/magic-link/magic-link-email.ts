import { escapeHtml } from './escape-html';

export type TMagicLinkEmailInput = {
  url: string;
  host: string;
};

export type TMagicLinkEmailContent = {
  subject: string;
  html: string;
};

/**
 * buildMagicLinkEmail — the plain-text-free HTML content for the Auth.js
 * Email provider's sign-in link. Pure and framework-free so it's testable
 * without mocking Auth.js/the app's email transport —
 * `magic-link-provider.ts`'s `sendVerificationRequest` is the only caller.
 */
export function buildMagicLinkEmail({
  url,
  host,
}: TMagicLinkEmailInput): TMagicLinkEmailContent {
  const escapedHost = escapeHtml(host);
  const escapedUrl = escapeHtml(url);

  return {
    subject: `Sign in to ${host}`,
    html: [
      `<p>Click the link below to sign in to ${escapedHost}.</p>`,
      `<p><a href="${escapedUrl}">Sign in to ${escapedHost}</a></p>`,
      `<p>If you did not request this email, you can safely ignore it.</p>`,
    ].join(''),
  };
}
