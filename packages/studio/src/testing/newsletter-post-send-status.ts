import { faker } from '@faker-js/faker';
import {
  ACTION_OUTCOME,
  NEWSLETTER_SEND_STATUS,
  type TNewsletterPostSendState,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';

faker.seed(7711);

const mockCount = () => faker.number.int({ min: 1_000, max: 9_999 });

export const MOCK_CONFIRMED_COUNT = mockCount();
export const MOCK_EMAILS_LEFT = mockCount();
export const MOCK_RECIPIENTS = mockCount();
export const MOCK_BAND_CEILING = mockCount();
export const MOCK_SEND_DATE = faker.date
  .between({ from: '2026-01-01', to: '2026-12-31' })
  .toISOString();

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
