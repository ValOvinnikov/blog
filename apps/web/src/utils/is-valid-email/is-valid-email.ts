// A deliberately loose format check — not RFC 5322 validation. This gates
// two things: `NewsletterForm`'s client-side check (skip the round-trip for
// an obviously malformed address) and `subscribeToNewsletterAction`'s
// server-side re-check (never trust the client-only pass). Real
// deliverability is Resend's problem, not this function's.
const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * isValidEmail — shared email-format check for the newsletter signup flow.
 *
 * @example
 * isValidEmail('reader@example.com') // true
 * isValidEmail('not-an-email') // false
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_FORMAT_PATTERN.test(email.trim());
}
