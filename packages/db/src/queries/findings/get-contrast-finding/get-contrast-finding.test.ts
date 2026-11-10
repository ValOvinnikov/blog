import { FINDING_STATUS } from '@blog/config/constants';
import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_NOW,
  mockContrastResult,
  mockPassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getContrastFinding } from './get-contrast-finding';

faker.seed(6021001);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(getContrastFinding, () => {
  it.each([
    {
      run: 'has passed',
      mockRun: mockPassingContrastResult,
      status: FINDING_STATUS.RESOLVED,
      hasPassed: true,
    },
    {
      run: 'has failed',
      mockRun: mockContrastResult,
      status: FINDING_STATUS.OPEN,
      hasPassed: false,
    },
  ])(
    'returns the result for a SHA whose run $run',
    async ({ mockRun, status, hasPassed }) => {
      const contrastRun = mockRun();
      await recordContrastResult(contrastRun);

      const finding = await getContrastFinding(contrastRun.sha);

      expect(finding?.status).toBe(status);
      expect(finding?.hasPassed).toBe(hasPassed);
      expect(finding?.details).toEqual(contrastRun);
    },
  );

  it('does not report a newer failure as passed once a pass on an older SHA resolves it', async () => {
    const newerFailure = mockContrastResult();
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
    await recordContrastResult(newerFailure);
    vi.setSystemTime(MOCK_FINDING_LATER_AT);
    await recordContrastResult(mockPassingContrastResult());

    const finding = await getContrastFinding(newerFailure.sha);

    expect(finding?.status).toBe(FINDING_STATUS.RESOLVED);
    expect(finding?.hasPassed).toBe(false);
  });

  it('returns undefined for a SHA with no run', async () => {
    const finding = await getContrastFinding(faker.git.commitSha());

    expect(finding).toBeUndefined();
  });
});
