import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { incrementMagicLinkSendCount } from './increment-magic-link-send-count';

vi.mock('@blog/db/client');

faker.seed(6022);

const MOCK_KEY = `email:${faker.string.alphanumeric(16)}`;
const MOCK_OTHER_KEY = `ip:${faker.string.alphanumeric(16)}`;
const MOCK_WINDOW_OPENED_AT = faker.date.recent();
const WINDOW_MS = 60 * 60_000;
const SECOND_MS = 1000;
const AFTER_WINDOW = new Date(
  MOCK_WINDOW_OPENED_AT.getTime() + WINDOW_MS + SECOND_MS,
);
const INSIDE_RESTARTED_WINDOW = new Date(
  AFTER_WINDOW.getTime() + WINDOW_MS / 2,
);

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
    const result = await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    expect(result).toBe(1);
  });

  it('counts every send inside the window', async () => {
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    const result = await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    expect(result).toBe(3);
  });

  it('counts each key on its own', async () => {
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    const result = await incrementMagicLinkSendCount(MOCK_OTHER_KEY, WINDOW_MS);

    expect(result).toBe(1);
  });

  it('restarts the count once the window has passed', async () => {
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);
    vi.setSystemTime(AFTER_WINDOW);

    const result = await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    expect(result).toBe(1);
  });

  it('keeps counting from the restarted window', async () => {
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);
    vi.setSystemTime(AFTER_WINDOW);
    await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);
    vi.setSystemTime(INSIDE_RESTARTED_WINDOW);

    const result = await incrementMagicLinkSendCount(MOCK_KEY, WINDOW_MS);

    expect(result).toBe(2);
  });
});
