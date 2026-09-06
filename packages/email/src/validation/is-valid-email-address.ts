const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a string is a syntactically well-formed email address.
 * Purely structural — it says nothing about whether the address exists,
 * accepts mail, or is authorised to send from a given domain.
 */
export function isValidEmailAddress(value: string): boolean {
  return EMAIL_ADDRESS_PATTERN.test(value);
}
