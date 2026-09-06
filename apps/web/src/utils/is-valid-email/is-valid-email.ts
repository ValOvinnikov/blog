const WHITESPACE_PATTERN = /\s/;

/**
 * isValidEmail — shared email-format check for the newsletter signup flow.
 * Deliberately loose — not RFC 5322 validation. Gates `NewsletterForm`'s
 * client-side check and `subscribeToNewsletterAction`'s server-side
 * re-check; real deliverability is Resend's problem, not this function's.
 *
 * Implemented with index/split checks rather than a regex, since a
 * pattern that captures this shape by construction backtracks
 * polynomially on malformed input.
 *
 * @example
 * isValidEmail('reader@example.com') // true
 * isValidEmail('not-an-email') // false
 */
export const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return false;
  }
  if (
    WHITESPACE_PATTERN.test(localPart) ||
    WHITESPACE_PATTERN.test(domainPart)
  ) {
    return false;
  }

  return domainPart.slice(1, -1).includes('.');
};
