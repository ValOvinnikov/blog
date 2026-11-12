import { isSecretMatch } from '@blog/utils';
import { keyedHmac } from '@blog/utils/encryption';

const TOKEN_SEPARATOR = '~';

/** The same token for every email to one subscriber, so each email's unsubscribe link keeps working. */
export function signNewsletterUnsubscribeToken(
  subscriberId: string,
  keyBase64: string,
): string {
  return `${subscriberId}${TOKEN_SEPARATOR}${keyedHmac(subscriberId, keyBase64)}`;
}

export function verifyNewsletterUnsubscribeToken(
  token: string,
  keyBase64: string,
): string | null {
  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (separatorIndex <= 0) return null;

  const subscriberId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  return isSecretMatch(signature, keyedHmac(subscriberId, keyBase64))
    ? subscriberId
    : null;
}
