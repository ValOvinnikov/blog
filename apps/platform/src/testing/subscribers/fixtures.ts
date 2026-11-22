import { faker } from '@faker-js/faker';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import { toSubscriberLimits } from '@platform/utils/subscriber-limits/subscriber-limits';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import type { TConfirmedSubscriber } from '@shinefold/db/queries/subscribers/confirmed-subscribers';

export const MOCK_SUBSCRIBERS_BAND_CEILING = 1_000;
export const MOCK_SUBSCRIBERS_NEXT_BAND = 2_500;
export const MOCK_SUBSCRIBERS_ALLOWANCE = 6_000;
export const MOCK_SUBSCRIBER_COUNT = 300;
export const MOCK_SENT_THIS_MONTH = 900;

export const MOCK_SUBSCRIBERS_LIMITS: TNewsletterLimits = {
  activeCount: MOCK_SUBSCRIBER_COUNT,
  bandCeiling: MOCK_SUBSCRIBERS_BAND_CEILING,
  allowance: MOCK_SUBSCRIBERS_ALLOWANCE,
  sentThisMonth: MOCK_SENT_THIS_MONTH,
};

export const MOCK_SUBSCRIBER_EMAIL = faker.internet.email();

export const mockConfirmedSubscriber = (
  overrides: Partial<TConfirmedSubscriber> = {},
): TConfirmedSubscriber => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  confirmedAt: faker.date.recent(),
  ...overrides,
});

export const mockSubscribersPageData = (
  overrides: Partial<TSubscribersPageData> = {},
  limits: Partial<TNewsletterLimits> = {},
): TSubscribersPageData => {
  const rows = [
    mockConfirmedSubscriber({ email: MOCK_SUBSCRIBER_EMAIL }),
    mockConfirmedSubscriber(),
  ];

  return {
    ...toSubscriberLimits({
      limits: { ...MOCK_SUBSCRIBERS_LIMITS, ...limits },
      isOperatorPaused: false,
      hasMovedUp: false,
    }),
    list: { rows, total: rows.length },
    page: 1,
    totalPages: 1,
    emailNewPosts: true,
    pausedAt: undefined,
    nextBand: MOCK_SUBSCRIBERS_NEXT_BAND,
    offer: undefined,
    skippedPost: undefined,
    ...overrides,
  };
};
