import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_OUTCOME = {
  ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED',
} as const;

export type TNewsletterOutcome = TValueOf<typeof NEWSLETTER_OUTCOME>;
