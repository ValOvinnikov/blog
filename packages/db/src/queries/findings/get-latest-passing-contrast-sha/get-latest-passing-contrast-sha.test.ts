import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { recordContrastResult } from '../record-contrast-result';

import { getLatestPassingContrastSha } from './get-latest-passing-contrast-sha';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const runUrl = 'https://github.com/example/runs/1';

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(getLatestPassingContrastSha, () => {
  it('returns undefined when no run has passed', async () => {
    await recordContrastResult({
      sha: 'abc123',
      outcome: CONTRAST_CHECK_OUTCOME.FAIL,
      failureCount: 1,
      runUrl,
    });

    expect(await getLatestPassingContrastSha()).toBeUndefined();
  });

  it('returns the SHA of the newest passing run, ignoring a newer failure', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    await recordContrastResult({
      sha: 'older',
      outcome: CONTRAST_CHECK_OUTCOME.PASS,
      failureCount: 0,
      runUrl,
    });
    vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
    await recordContrastResult({
      sha: 'newer',
      outcome: CONTRAST_CHECK_OUTCOME.PASS,
      failureCount: 0,
      runUrl,
    });
    vi.setSystemTime(new Date('2026-10-03T10:00:00Z'));
    await recordContrastResult({
      sha: 'newest-failing',
      outcome: CONTRAST_CHECK_OUTCOME.FAIL,
      failureCount: 4,
      runUrl,
    });

    expect(await getLatestPassingContrastSha()).toBe('newer');
  });
});
