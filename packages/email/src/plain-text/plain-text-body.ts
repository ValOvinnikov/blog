import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import { sanitizeHref } from '@shinefold/utils';

export function buildPlainTextBody(
  paragraphs: string[],
  ...actions: TEmailAction[]
): string {
  const actionLines = actions.map(
    ({ label, url }) => `${label}: ${sanitizeHref(url) ?? ''}`,
  );

  return [...paragraphs, ...actionLines].join('\n\n');
}
