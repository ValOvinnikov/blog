import { FINDING_STATUS } from '@blog/config/constants';
import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import * as schema from '@blog/db/schema';
import {
  mockContrastResult,
  mockPassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getContrastFinding } from './get-contrast-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(getContrastFinding, () => {
  it.each([
    {
      run: 'has passed',
      mockRun: mockPassingContrastResult,
      status: FINDING_STATUS.RESOLVED,
    },
    {
      run: 'has failed',
      mockRun: mockContrastResult,
      status: FINDING_STATUS.OPEN,
    },
  ])(
    'returns the result for a SHA whose run $run',
    async ({ mockRun, status }) => {
      const contrastRun = mockRun();
      await recordContrastResult(contrastRun);

      const finding = await getContrastFinding(contrastRun.sha);

      expect(finding?.status).toBe(status);
      expect(finding?.details).toEqual(contrastRun);
    },
  );

  it('returns undefined for a SHA with no run', async () => {
    expect(await getContrastFinding(faker.git.commitSha())).toBeUndefined();
  });
});
