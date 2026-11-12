import type { TMaybeNull } from '@blog/config';
import {
  signNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from '@blog/utils/newsletter-unsubscribe-token';
import { env } from '@web/utils/env/env';

export const mintNewsletterUnsubscribeToken = (
  subscriberId: string,
): string => {
  const key = env.NEWSLETTER_UNSUBSCRIBE_KEY;
  if (!key) throw new Error('NEWSLETTER_UNSUBSCRIBE_KEY is not set.');

  return signNewsletterUnsubscribeToken(subscriberId, key);
};

export const readNewsletterUnsubscribeSubscriberId = (
  token: string,
): TMaybeNull<string> => {
  const key = env.NEWSLETTER_UNSUBSCRIBE_KEY;
  return key ? verifyNewsletterUnsubscribeToken(token, key) : null;
};
