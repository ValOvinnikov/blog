import { CONTRAST_CHECK_OUTCOME, FINDING_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { recordContrastResult } from '../record-contrast-result';

import { getContrastFinding } from './get-contrast-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(getContrastFinding, () => {
  it('returns the result for a SHA whose run passed', async () => {
    await recordContrastResult({
      sha: 'abc123',
      outcome: CONTRAST_CHECK_OUTCOME.PASS,
      failureCount: 0,
      runUrl: 'https://github.com/example/runs/1',
    });

    expect(await getContrastFinding('abc123')).toEqual(
      expect.objectContaining({ status: FINDING_STATUS.RESOLVED }),
    );
  });

  it('returns the result for a SHA whose run failed', async () => {
    await recordContrastResult({
      sha: 'abc123',
      outcome: CONTRAST_CHECK_OUTCOME.FAIL,
      failureCount: 2,
      runUrl: 'https://github.com/example/runs/1',
    });

    expect(await getContrastFinding('abc123')).toEqual(
      expect.objectContaining({ status: FINDING_STATUS.OPEN }),
    );
  });

  it('returns undefined for a SHA with no run', async () => {
    expect(await getContrastFinding('never-run')).toBeUndefined();
  });
});
