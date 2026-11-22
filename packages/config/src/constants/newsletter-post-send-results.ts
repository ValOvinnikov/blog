import type { ACTION_OUTCOME } from './action-outcome';
import {
  type NEWSLETTER_TEST_SEND_REFUSAL,
  type TNewsletterSendNowRefusal,
  type TNewsletterTestSendRefusal,
} from './newsletter-post-send';

export type TNewsletterTestSendResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; recipient: string }
  | {
      outcome: typeof ACTION_OUTCOME.REFUSED;
      reason: Exclude<
        TNewsletterTestSendRefusal,
        typeof NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED
      >;
    }
  | {
      outcome: typeof ACTION_OUTCOME.REFUSED;
      reason: typeof NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED;
      retryAt: string;
    };

export type TNewsletterSendNowResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS }
  | {
      outcome: typeof ACTION_OUTCOME.REFUSED;
      reason: TNewsletterSendNowRefusal;
    };
