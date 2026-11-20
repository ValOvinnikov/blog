import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_AFTER_WINDOW,
  MOCK_WINDOW_MS,
  MOCK_WINDOW_OPENED_AT,
} from '@shinefold/db/testing/fixed-window-counters/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { incrementTestEmailSendCount } from './increment-test-email-send-count';

vi.mock('@shinefold/db/client');

faker.seed(7706);

const MOCK_KEY = faker.string.uuid();
const MOCK_OTHER_KEY = faker.string.uuid();

const db = useQueryTestDb();

useFrozenClock(MOCK_WINDOW_OPENED_AT);

afterEach(async () => {
  await db().delete(schema.testEmailSendCounters);
});

describe(incrementTestEmailSendCount, () => {
  it('starts a new count at one with the window opening now', async () => {
    expect(await incrementTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS)).toEqual(
      { count: 1, windowStartedAt: MOCK_WINDOW_OPENED_AT },
    );
  });

  describe('with a send already counted', () => {
    beforeEach(async () => {
      await incrementTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS);
    });

    it('counts each send of one key inside its window', async () => {
      await incrementTestEmailSendCount(MOCK_OTHER_KEY, MOCK_WINDOW_MS);

      expect(
        await incrementTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS),
      ).toEqual({ count: 2, windowStartedAt: MOCK_WINDOW_OPENED_AT });
    });

    it('starts again at one once the window has passed', async () => {
      vi.setSystemTime(MOCK_AFTER_WINDOW);

      expect(
        await incrementTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS),
      ).toEqual({ count: 1, windowStartedAt: MOCK_AFTER_WINDOW });
    });
  });
});
