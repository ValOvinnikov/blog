import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_LATEST_AT,
  MOCK_FINDING_NOW,
  mockContrastResult,
  mockPassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getLatestPassingContrastSha } from './get-latest-passing-contrast-sha';

faker.seed(6021003);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(getLatestPassingContrastSha, () => {
  it('returns undefined when no run has passed', async () => {
    await recordContrastResult(mockContrastResult());

    const sha = await getLatestPassingContrastSha();

    expect(sha).toBeUndefined();
  });

  it('returns the SHA of the newest passing run, ignoring a newer failure', async () => {
    const newerPass = mockPassingContrastResult();
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
    await recordContrastResult(mockPassingContrastResult());
    vi.setSystemTime(MOCK_FINDING_LATER_AT);
    await recordContrastResult(newerPass);
    vi.setSystemTime(MOCK_FINDING_LATEST_AT);
    await recordContrastResult(mockContrastResult());

    const sha = await getLatestPassingContrastSha();

    expect(sha).toBe(newerPass.sha);
  });

  it('never returns a failure a pass on another SHA resolved', async () => {
    const earliestPass = mockPassingContrastResult();
    const passingRun = mockPassingContrastResult();
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
    await recordContrastResult(earliestPass);
    vi.setSystemTime(MOCK_FINDING_LATER_AT);
    await recordContrastResult(mockContrastResult());
    vi.setSystemTime(MOCK_FINDING_LATEST_AT);
    await recordContrastResult(passingRun);
    await recordContrastResult(mockContrastResult({ sha: passingRun.sha }));

    const sha = await getLatestPassingContrastSha();

    expect(sha).toBe(earliestPass.sha);
  });
});
