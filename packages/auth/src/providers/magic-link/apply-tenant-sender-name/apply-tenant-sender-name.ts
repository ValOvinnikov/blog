import type { TMaybeUndefined } from '@blog/config';

const FROM_WITH_DISPLAY_NAME_PATTERN = /^(.*)<([^<>]+)>\s*$/;

/**
 * A tenant may brand who a sign-in email appears to be from, never which
 * address it sends from.
 */
export function applyTenantSenderName(
  from: string,
  senderName: TMaybeUndefined<string>,
): string {
  if (!senderName) return from;

  const sanitizedSenderName = senderName.replace(/[\r\n<>]/g, '').trim();
  if (!sanitizedSenderName) return from;

  const match = FROM_WITH_DISPLAY_NAME_PATTERN.exec(from);
  const address = match ? match[2]!.trim() : from.trim();
  const quotedSenderName = sanitizedSenderName.replace(/["\\]/g, '\\$&');

  return `"${quotedSenderName}" <${address}>`;
}
