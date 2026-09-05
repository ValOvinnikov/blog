const FROM_WITH_DISPLAY_NAME_PATTERN = /^(.*)<([^<>]+)>\s*$/;

/**
 * Overrides a resolved `from` address's display name with a tenant's
 * configured sender name, keeping the address untouched — a tenant may
 * brand who a sign-in email appears to be from, never which address it
 * actually sends from.
 */
export function applyTenantSenderName(
  from: string,
  senderName: string | undefined,
): string {
  if (!senderName) return from;

  const sanitizedSenderName = senderName.replace(/[\r\n<>]/g, '').trim();
  if (!sanitizedSenderName) return from;

  const match = FROM_WITH_DISPLAY_NAME_PATTERN.exec(from);
  const address = match ? match[2]!.trim() : from.trim();

  return `${sanitizedSenderName} <${address}>`;
}
