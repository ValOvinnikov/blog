import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TValueOf } from '@shinefold/config/utils';

import { ACTION_OUTCOME } from './action-outcome';
import {
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSendingOffCause,
  type TNewsletterSkipReason,
} from './newsletter-skip-reason';

export const NEWSLETTER_SEND_STATUS = {
  NONE: 'NONE',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  SKIPPED: 'SKIPPED',
} as const;

export type TNewsletterSendStatus = TValueOf<typeof NEWSLETTER_SEND_STATUS>;

export const NEWSLETTER_SEND_NOW_REFUSAL = {
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  NEWSLETTER_OFF: NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
  SENDING_OFF: NEWSLETTER_SKIP_REASON.SENDING_OFF,
  OVER_BAND: 'OVER_BAND',
  OVER_MONTH: 'OVER_MONTH',
  ALREADY_SENT: 'ALREADY_SENT',
  SEND_FAILED: 'SEND_FAILED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type TNewsletterSendNowRefusal = TValueOf<
  typeof NEWSLETTER_SEND_NOW_REFUSAL
>;

export const NEWSLETTER_TEST_SEND_REFUSAL = {
  INVALID_FIELDS: 'INVALID_FIELDS',
  RATE_LIMITED: ACTION_OUTCOME.RATE_LIMITED,
  SEND_FAILED: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
  FORBIDDEN: NEWSLETTER_SEND_NOW_REFUSAL.FORBIDDEN,
} as const;

export type TNewsletterTestSendRefusal = TValueOf<
  typeof NEWSLETTER_TEST_SEND_REFUSAL
>;

export const NEWSLETTER_SEND_STATUS_REFUSAL = {
  FORBIDDEN: NEWSLETTER_SEND_NOW_REFUSAL.FORBIDDEN,
} as const;

export type TNewsletterSendStatusRefusal = TValueOf<
  typeof NEWSLETTER_SEND_STATUS_REFUSAL
>;

export type TNewsletterSendNowEligibility =
  | { isOffered: false }
  | { isOffered: true; disabledBy?: undefined; emailsLeft: number }
  | {
      isOffered: true;
      disabledBy:
        | typeof NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF
        | typeof NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF;
    }
  | {
      isOffered: true;
      disabledBy: typeof NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND;
      bandCeiling: number;
    }
  | {
      isOffered: true;
      disabledBy: typeof NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH;
      emailsNeeded: number;
      emailsLeft: number;
      resetsAt: string;
    };

export type TNewsletterPostSendState =
  | { status: typeof NEWSLETTER_SEND_STATUS.NONE }
  | { status: typeof NEWSLETTER_SEND_STATUS.SCHEDULED; scheduledFor: string }
  | {
      status: typeof NEWSLETTER_SEND_STATUS.SENDING;
      sent?: number;
      recipients?: number;
    }
  | {
      status: typeof NEWSLETTER_SEND_STATUS.SENT;
      recipients: number;
      settledAt: string;
    }
  | {
      status: typeof NEWSLETTER_SEND_STATUS.SKIPPED;
      skipReason: Exclude<
        TNewsletterSkipReason,
        typeof NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND
      >;
    }
  | {
      status: typeof NEWSLETTER_SEND_STATUS.SKIPPED;
      skipReason: typeof NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND;
      bandCeiling: number;
    };

export type TNewsletterPostSendStatusResponse =
  | ({ outcome: typeof ACTION_OUTCOME.SUCCESS } & TNewsletterPostSendState & {
        confirmedCount: number;
        sendingOffCause: TMaybeUndefined<TNewsletterSendingOffCause>;
        sendNow: TNewsletterSendNowEligibility;
      })
  | {
      outcome: typeof ACTION_OUTCOME.REFUSED;
      reason: TNewsletterSendStatusRefusal;
    };

export type TNewsletterPostSendStatus = Extract<
  TNewsletterPostSendStatusResponse,
  { outcome: typeof ACTION_OUTCOME.SUCCESS }
>;
