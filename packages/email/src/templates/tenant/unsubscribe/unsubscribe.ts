import type { TEmailAction } from '@blog/email/html/email-action/email-action';
import { sanitizeHref } from '@blog/utils';

export const LIST_UNSUBSCRIBE_ONE_CLICK = 'List-Unsubscribe=One-Click';

// RFC 8058 one-click unsubscribe requires an https URI, so any other URL sends no header.
export function buildListUnsubscribeHeaders(
  unsubscribeUrl: string,
): Record<string, string> {
  const safeUrl = sanitizeHref(unsubscribeUrl);
  if (!safeUrl?.startsWith('https:')) return {};

  return {
    'List-Unsubscribe': `<${safeUrl}>`,
    'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
  };
}

export function buildUnsubscribeAction(unsubscribeUrl: string): TEmailAction {
  return { label: 'Unsubscribe', url: unsubscribeUrl, variant: 'link' };
}
