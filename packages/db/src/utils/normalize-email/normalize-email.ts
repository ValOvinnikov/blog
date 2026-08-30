// Canonical form every email-keyed lookup/insert compares against, so
// `Foo@Example.com` and `foo@example.com ` collide on the same row rather
// than depending on Postgres's case-sensitive `text` comparison to catch it.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
