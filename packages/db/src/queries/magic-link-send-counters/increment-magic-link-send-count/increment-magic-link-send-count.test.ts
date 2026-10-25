import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { incrementMagicLinkSendCount } from './increment-magic-link-send-count';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const KEY = 'email:hash-1';
const WINDOW_MS = 60 * 60_000;
const WINDOW_OPENED_AT = new Date('2026-10-21T10:00:00Z');
const AFTER_WINDOW = new Date('2026-10-21T11:00:01Z');

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.magicLinkSendCounters);
});

describe(incrementMagicLinkSendCount, () => {
  it('starts a new counter at one', async () => {
    const result = await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    expect(result).toBe(1);
  });

  it('counts every send inside the window', async () => {
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    const result = await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    expect(result).toBe(3);
  });

  it('counts each key on its own', async () => {
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    const result = await incrementMagicLinkSendCount('ip:hash-2', WINDOW_MS);

    expect(result).toBe(1);
  });

  it('restarts the count once the window has passed', async () => {
    vi.useFakeTimers({ now: WINDOW_OPENED_AT });
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);
    vi.setSystemTime(AFTER_WINDOW);

    const result = await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    expect(result).toBe(1);
  });

  it('keeps counting from the restarted window', async () => {
    vi.useFakeTimers({ now: WINDOW_OPENED_AT });
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);
    vi.setSystemTime(AFTER_WINDOW);
    await incrementMagicLinkSendCount(KEY, WINDOW_MS);
    vi.setSystemTime(new Date('2026-10-21T11:30:00Z'));

    const result = await incrementMagicLinkSendCount(KEY, WINDOW_MS);

    expect(result).toBe(2);
  });
});
