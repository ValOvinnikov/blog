/** The exact address an account or invite belongs to: `Foo@Example.com` and `foo@example.com` match, `foo+news@example.com` does not. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
