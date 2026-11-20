import { faker } from '@faker-js/faker';
import { incrementTestEmailSendCount } from '@shinefold/db/queries/test-email-send-counters/increment-test-email-send-count';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_AFTER_WINDOW,
  MOCK_WINDOW_MS,
  MOCK_WINDOW_OPENED_AT,
} from '@shinefold/db/testing/fixed-window-counters/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { getTestEmailSendCount } from './get-test-email-send-count';

vi.mock('@shinefold/db/client');

faker.seed(7710);

const MOCK_KEY = faker.string.uuid();

const db = useQueryTestDb();

useFrozenClock(MOCK_WINDOW_OPENED_AT);

afterEach(async () => {
  await db().delete(schema.testEmailSendCounters);
});

describe(getTestEmailSendCount, () => {
  it('reads nothing for a key with no sends', async () => {
    expect(
      await getTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS),
    ).toBeUndefined();
  });

  describe('with a send already counted', () => {
    beforeEach(async () => {
      await incrementTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS);
    });

    it('reads the open window without counting a send', async () => {
      await getTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS);

      expect(await getTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS)).toEqual({
        count: 1,
        windowStartedAt: MOCK_WINDOW_OPENED_AT,
      });
    });

    it('reads nothing once the window has passed', async () => {
      vi.setSystemTime(MOCK_AFTER_WINDOW);

      expect(
        await getTestEmailSendCount(MOCK_KEY, MOCK_WINDOW_MS),
      ).toBeUndefined();
    });
  });
});
