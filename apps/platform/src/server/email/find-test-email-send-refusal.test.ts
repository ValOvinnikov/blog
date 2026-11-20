import { faker } from '@faker-js/faker';
import { MOCK_TEST_EMAIL_LIMIT_REFUSAL } from '@platform/testing/email/fixtures';
import { queries } from '@shinefold/db';

import { findTestEmailSendRefusal } from './find-test-email-send-refusal';

vi.mock('@shinefold/db', () => ({
  queries: {
    testEmailSendCounters: { incrementTestEmailSendCount: vi.fn() },
  },
}));

faker.seed(7711);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_WINDOW_STARTED_AT = new Date('2026-11-20T00:00:00.000Z');
const HOUR_KEY = `test-email-hour:${MOCK_USER_ID}`;
const DAY_KEY = `test-email-day:${MOCK_USER_ID}`;

const incrementTestEmailSendCount = vi.mocked(
  queries.testEmailSendCounters.incrementTestEmailSendCount,
);

const countSends = (counts: Record<string, number>) =>
  incrementTestEmailSendCount.mockImplementation(async (key) => ({
    count: counts[key] ?? 1,
    windowStartedAt: MOCK_WINDOW_STARTED_AT,
  }));

describe(findTestEmailSendRefusal, () => {
  beforeEach(() => {
    incrementTestEmailSendCount.mockReset();
  });

  it("admits a send within the hour's five and the day's twenty", async () => {
    countSends({ [HOUR_KEY]: 5, [DAY_KEY]: 20 });

    expect(await findTestEmailSendRefusal(MOCK_USER_ID)).toBeUndefined();
  });

  it("refuses the hour's sixth send until the hour ends, sparing the day", async () => {
    const { count, windowStartedAt, retryAt } = MOCK_TEST_EMAIL_LIMIT_REFUSAL;
    incrementTestEmailSendCount.mockResolvedValue({ count, windowStartedAt });

    const refusal = await findTestEmailSendRefusal(MOCK_USER_ID);

    expect(refusal).toEqual({ retryAt: new Date(retryAt) });
    expect(incrementTestEmailSendCount).toHaveBeenCalledOnce();
  });

  it("refuses the day's 21st send until the day's window ends", async () => {
    countSends({ [DAY_KEY]: 21 });

    const refusal = await findTestEmailSendRefusal(MOCK_USER_ID);

    expect(refusal).toEqual({
      retryAt: new Date('2026-11-21T00:00:00.000Z'),
    });
  });
});
