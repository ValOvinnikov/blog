import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_AFTER_WINDOW,
  MOCK_INSIDE_RESTARTED_WINDOW,
  MOCK_WINDOW_MS,
  MOCK_WINDOW_OPENED_AT,
} from '@shinefold/db/testing/fixed-window-counters/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { incrementMagicLinkSendCount } from './increment-magic-link-send-count';

vi.mock('@shinefold/db/client');

faker.seed(6022);

const MOCK_KEY = `email:${faker.string.alphanumeric(16)}`;
const MOCK_OTHER_KEY = `ip:${faker.string.alphanumeric(16)}`;

const db = useQueryTestDb();

beforeEach(() => {
  vi.useFakeTimers({ now: MOCK_WINDOW_OPENED_AT });
});

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.magicLinkSendCounters);
});

describe(incrementMagicLinkSendCount, () => {
  it('starts a new counter at one', async () => {
    const result = await incrementMagicLinkSendCount(MOCK_KEY, MOCK_WINDOW_MS);

    expect(result).toBe(1);
  });

  describe('with a send already counted', () => {
    beforeEach(async () => {
      await incrementMagicLinkSendCount(MOCK_KEY, MOCK_WINDOW_MS);
    });

    it('counts every send inside the window', async () => {
      const result = await incrementMagicLinkSendCount(
        MOCK_KEY,
        MOCK_WINDOW_MS,
      );

      expect(result).toBe(2);
    });

    it('counts each key on its own', async () => {
      const result = await incrementMagicLinkSendCount(
        MOCK_OTHER_KEY,
        MOCK_WINDOW_MS,
      );

      expect(result).toBe(1);
    });

    describe('once the window has passed', () => {
      beforeEach(() => {
        vi.setSystemTime(MOCK_AFTER_WINDOW);
      });

      it('restarts the count', async () => {
        const result = await incrementMagicLinkSendCount(
          MOCK_KEY,
          MOCK_WINDOW_MS,
        );

        expect(result).toBe(1);
      });

      it('keeps counting from the restarted window', async () => {
        await incrementMagicLinkSendCount(MOCK_KEY, MOCK_WINDOW_MS);
        vi.setSystemTime(MOCK_INSIDE_RESTARTED_WINDOW);

        const result = await incrementMagicLinkSendCount(
          MOCK_KEY,
          MOCK_WINDOW_MS,
        );

        expect(result).toBe(2);
      });
    });
  });
});
