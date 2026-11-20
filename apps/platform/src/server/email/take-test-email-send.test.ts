import { faker } from '@faker-js/faker';
import { MOCK_TEST_EMAIL_LIMIT_REFUSAL } from '@platform/testing/email/fixtures';
import {
  DAY_MS,
  HOUR_MS,
} from '@platform/utils/format-relative-time/format-relative-time';
import { queries } from '@shinefold/db';

import { takeTestEmailSend } from './take-test-email-send';

vi.mock('@shinefold/db', () => ({
  queries: {
    testEmailSendCounters: {
      incrementTestEmailSendCount: vi.fn(),
      getTestEmailSendCount: vi.fn(),
    },
  },
}));

faker.seed(7711);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_DAY_STARTED_AT = new Date('2026-11-20T00:00:00.000Z');
const MOCK_DAY_ENDS_AT = new Date('2026-11-21T00:00:00.000Z');
const {
  count: MOCK_HOUR_OVER_COUNT,
  windowStartedAt,
  retryAt,
} = MOCK_TEST_EMAIL_LIMIT_REFUSAL;

const { incrementTestEmailSendCount, getTestEmailSendCount } = vi.mocked(
  queries.testEmailSendCounters,
);

const countSends = (counts: { hour: number; day: number }) =>
  incrementTestEmailSendCount.mockImplementation(async (_key, windowMs) =>
    windowMs === HOUR_MS
      ? { count: counts.hour, windowStartedAt }
      : { count: counts.day, windowStartedAt: MOCK_DAY_STARTED_AT },
  );

describe(takeTestEmailSend, () => {
  beforeEach(() => {
    incrementTestEmailSendCount.mockReset();
    getTestEmailSendCount.mockResolvedValue(undefined);
  });

  it("admits a send within the hour's five and the day's twenty", async () => {
    countSends({ hour: 5, day: 20 });

    expect(await takeTestEmailSend(MOCK_USER_ID)).toBeUndefined();
  });

  describe("past the hour's five", () => {
    beforeEach(() => {
      countSends({ hour: MOCK_HOUR_OVER_COUNT, day: 1 });
    });

    it('refuses until the hour ends, sparing the day', async () => {
      const refusal = await takeTestEmailSend(MOCK_USER_ID);

      expect(refusal).toEqual({ retryAt: new Date(retryAt) });
      expect(incrementTestEmailSendCount).toHaveBeenCalledOnce();
      expect(incrementTestEmailSendCount).toHaveBeenCalledWith(
        expect.any(String),
        HOUR_MS,
      );
    });

    it('refuses until the day ends when the day is also used up', async () => {
      getTestEmailSendCount.mockResolvedValue({
        count: 20,
        windowStartedAt: MOCK_DAY_STARTED_AT,
      });

      const refusal = await takeTestEmailSend(MOCK_USER_ID);

      expect(refusal).toEqual({ retryAt: MOCK_DAY_ENDS_AT });
      expect(getTestEmailSendCount).toHaveBeenCalledWith(
        expect.any(String),
        DAY_MS,
      );
    });
  });

  it("refuses the day's 21st send until the day's window ends", async () => {
    countSends({ hour: 1, day: 21 });

    const refusal = await takeTestEmailSend(MOCK_USER_ID);

    expect(refusal).toEqual({ retryAt: MOCK_DAY_ENDS_AT });
  });
});
