import {
  ACTION_OUTCOME,
  NEWSLETTER_SEND_STATUS,
  type TNewsletterPostSendState,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';

export const MOCK_CONFIRMED_COUNT = 1_240;
export const MOCK_EMAILS_LEFT = 14_600;

type TStatusExtras = Partial<
  Pick<
    TNewsletterPostSendStatus,
    'confirmedCount' | 'sendingOffCause' | 'sendNow'
  >
>;

export const mockNewsletterPostSendStatus = (
  state: TNewsletterPostSendState = { status: NEWSLETTER_SEND_STATUS.NONE },
  extras: TStatusExtras = {},
): TNewsletterPostSendStatus => ({
  outcome: ACTION_OUTCOME.SUCCESS,
  ...state,
  confirmedCount: MOCK_CONFIRMED_COUNT,
  sendingOffCause: undefined,
  sendNow: { isOffered: false },
  ...extras,
});
