import { CONTRAST_CHECK_OUTCOME, ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { recordContrastResult } from '../record-contrast-result';

import { tagContrastFinding } from './tag-contrast-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(tagContrastFinding, () => {
  it('adds the release tag to the SHA’s contrast finding, keeping its result', async () => {
    const run = {
      sha: 'abc123',
      outcome: CONTRAST_CHECK_OUTCOME.PASS,
      failureCount: 0,
      runUrl: 'https://github.com/example/runs/1',
    };
    await recordContrastResult(run);

    const result = await tagContrastFinding('abc123', 'v1.4.0');

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({ details: { ...run, tag: 'v1.4.0' } }),
    });
  });

  it('reports DB_NOT_FOUND for a SHA with no contrast run', async () => {
    expect(await tagContrastFinding('never-run', 'v1.4.0')).toEqual({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });
});
