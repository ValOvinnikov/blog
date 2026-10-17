import { FINDING_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  makeContrastResult,
  makePassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

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
    const passingRun = makePassingContrastResult();
    await recordContrastResult(passingRun);

    expect(await getContrastFinding(passingRun.sha)).toEqual(
      expect.objectContaining({ status: FINDING_STATUS.RESOLVED }),
    );
  });

  it('returns the result for a SHA whose run failed', async () => {
    const failingRun = makeContrastResult();
    await recordContrastResult(failingRun);

    expect(await getContrastFinding(failingRun.sha)).toEqual(
      expect.objectContaining({ status: FINDING_STATUS.OPEN }),
    );
  });

  it('returns undefined for a SHA with no run', async () => {
    expect(await getContrastFinding(faker.git.commitSha())).toBeUndefined();
  });
});
