export const LIST_UNSUBSCRIBE_ONE_CLICK = 'List-Unsubscribe=One-Click';

export function buildListUnsubscribeHeaders(
  unsubscribeUrl: string,
): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
  };
}
