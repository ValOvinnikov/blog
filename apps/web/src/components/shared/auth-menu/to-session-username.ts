/**
 * Derives the `WindowChrome.User` segment for a signed-in reader from real
 * session data — never a hardcoded placeholder. Prefers the email's local
 * part (matches the mock's terminal-`whoami` voice: a username, not a full
 * display name); falls back to `name` lowercased with whitespace stripped
 * (not a true slugify — punctuation/diacritics pass through untouched), then
 * a generic noun if the session has neither. Each branch checks the
 * *transformed* result for actual non-emptiness before returning it — an
 * empty-local-part email (`@example.com`) or a whitespace-only `name`
 * transform to `''`, which must fall through rather than render blank.
 */
export function toSessionUsername(
  name?: string | null,
  email?: string | null,
): string {
  const emailLocalPart = email?.split('@')[0]?.trim() ?? '';
  if (emailLocalPart.length > 0) {
    return emailLocalPart;
  }

  const slugifiedName = name?.toLowerCase().replace(/\s+/g, '') ?? '';
  if (slugifiedName.length > 0) {
    return slugifiedName;
  }

  return 'user';
}
