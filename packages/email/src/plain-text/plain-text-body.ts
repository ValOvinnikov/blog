import type { TEmailAction } from '@blog/email/html/email-action/email-action';
import { sanitizeHref } from '@blog/utils';

export function buildPlainTextBody(
  paragraphs: string[],
  action?: TEmailAction,
): string {
  const actionLine = action
    ? [`${action.label}: ${sanitizeHref(action.url) ?? ''}`]
    : [];

  return [...paragraphs, ...actionLine].join('\n\n');
}
