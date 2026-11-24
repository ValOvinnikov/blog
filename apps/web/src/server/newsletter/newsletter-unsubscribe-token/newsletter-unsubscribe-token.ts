import type { TMaybeNull } from '@shinefold/config';
import {
  signNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from '@shinefold/utils/newsletter-unsubscribe-token';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

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
  if (!key) {
    logger.error(NEWSLETTER_LOG.UNSUBSCRIBE_KEY_MISSING);
    return null;
  }

  return verifyNewsletterUnsubscribeToken(token, key);
};
