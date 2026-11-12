import { createHmac } from 'node:crypto';

import { isSecretMatch } from '@blog/utils';
import { KEY_ENCODING, PAYLOAD_ENCODING } from '@blog/utils/encryption';
import { SHA256_ALGORITHM } from '@blog/utils/hash';

const TOKEN_SEPARATOR = '~';

function signSubscriberId(subscriberId: string, keyBase64: string): string {
  return createHmac(SHA256_ALGORITHM, Buffer.from(keyBase64, KEY_ENCODING))
    .update(subscriberId)
    .digest(PAYLOAD_ENCODING);
}

/** The same token for every email to one subscriber, so each email's unsubscribe link keeps working. */
export function signNewsletterUnsubscribeToken(
  subscriberId: string,
  keyBase64: string,
): string {
  return `${subscriberId}${TOKEN_SEPARATOR}${signSubscriberId(subscriberId, keyBase64)}`;
}

export function verifyNewsletterUnsubscribeToken(
  token: string,
  keyBase64: string,
): string | null {
  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (separatorIndex <= 0) return null;

  const subscriberId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  return isSecretMatch(signature, signSubscriberId(subscriberId, keyBase64))
    ? subscriberId
    : null;
}
