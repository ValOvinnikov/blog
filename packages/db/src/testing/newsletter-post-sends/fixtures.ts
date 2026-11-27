import type { INewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const newsletterPostSendsFaker = createMockFaker(7158);

export const MOCK_POST_ID = newsletterPostSendsFaker.string.uuid();
export const MOCK_OTHER_POST_ID = newsletterPostSendsFaker.string.uuid();

export const MOCK_NEXT_MONTH = new Date(
  Date.UTC(MOCK_NOW.getUTCFullYear(), MOCK_NOW.getUTCMonth() + 1),
);

export const MOCK_EARLIER_CLAIMED_AT = new Date(MOCK_NOW.getTime() - 60_000);
export const MOCK_LATER = new Date(MOCK_NOW.getTime() + 60_000);

export const MOCK_POST_SEND_START = {
  postTitle: newsletterPostSendsFaker.lorem.sentence(),
  postPublishedAt: newsletterPostSendsFaker.date.past({ refDate: MOCK_NOW }),
  recipientCount: newsletterPostSendsFaker.number.int({ min: 10, max: 500 }),
};

export const MOCK_SKIP_DETAILS = {
  emailsNeeded: newsletterPostSendsFaker.number.int({ min: 100, max: 200 }),
  allowanceLeft: newsletterPostSendsFaker.number.int({ min: 1, max: 99 }),
  bandCeiling: newsletterPostSendsFaker.number.int({ min: 1_000, max: 5_000 }),
  postTitle: MOCK_POST_SEND_START.postTitle,
  postPublishedAt: MOCK_POST_SEND_START.postPublishedAt,
};

export const MOCK_SCHEDULED_FOR = newsletterPostSendsFaker.date.future({
  refDate: MOCK_NOW,
});

export function mockNewsletterPostSend(
  overrides: Partial<INewsletterPostSend> = {},
): INewsletterPostSend {
  return {
    claimedAt: MOCK_NOW,
    outcome: undefined,
    skipReason: undefined,
    postTitle: undefined,
    postPublishedAt: undefined,
    recipientCount: undefined,
    sentCount: 0,
    emailsNeeded: undefined,
    allowanceLeft: undefined,
    bandCeiling: undefined,
    scheduledFor: undefined,
    settledAt: undefined,
    handStartedAt: undefined,
    ...overrides,
  };
}
