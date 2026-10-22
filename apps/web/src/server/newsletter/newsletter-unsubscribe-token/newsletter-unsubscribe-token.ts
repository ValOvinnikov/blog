import { createHmac } from 'node:crypto';

import type { TMaybeNull } from '@blog/config';
import { isSecretMatch } from '@blog/utils';
import { KEY_ENCODING, PAYLOAD_ENCODING } from '@blog/utils/encryption';
import { SHA256_ALGORITHM } from '@blog/utils/hash';
import { env } from '@web/utils/env/env';

const TOKEN_SEPARATOR = '~';

const signSubscriberId = (subscriberId: string, keyBase64: string): string =>
  createHmac(SHA256_ALGORITHM, Buffer.from(keyBase64, KEY_ENCODING))
    .update(subscriberId)
    .digest(PAYLOAD_ENCODING);

/** The same token for every email to one subscriber, so each email's unsubscribe link keeps working. */
export const mintNewsletterUnsubscribeToken = (
  subscriberId: string,
): string => {
  const key = env.NEWSLETTER_UNSUBSCRIBE_KEY;
  if (!key) throw new Error('NEWSLETTER_UNSUBSCRIBE_KEY is not set.');

  return `${subscriberId}${TOKEN_SEPARATOR}${signSubscriberId(subscriberId, key)}`;
};

export const readNewsletterUnsubscribeSubscriberId = (
  token: string,
): TMaybeNull<string> => {
  const key = env.NEWSLETTER_UNSUBSCRIBE_KEY;
  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (!key || separatorIndex <= 0) return null;

  const subscriberId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  return isSecretMatch(signature, signSubscriberId(subscriberId, key))
    ? subscriberId
    : null;
};
