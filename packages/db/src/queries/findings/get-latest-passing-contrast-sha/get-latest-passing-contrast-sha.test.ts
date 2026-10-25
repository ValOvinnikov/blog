import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import * as schema from '@blog/db/schema';
import {
  mockContrastResult,
  mockPassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getLatestPassingContrastSha } from './get-latest-passing-contrast-sha';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(getLatestPassingContrastSha, () => {
  it('returns undefined when no run has passed', async () => {
    await recordContrastResult(mockContrastResult());

    expect(await getLatestPassingContrastSha()).toBeUndefined();
  });

  it('returns the SHA of the newest passing run, ignoring a newer failure', async () => {
    const newerPass = mockPassingContrastResult();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    await recordContrastResult(mockPassingContrastResult());
    vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
    await recordContrastResult(newerPass);
    vi.setSystemTime(new Date('2026-10-03T10:00:00Z'));
    await recordContrastResult(mockContrastResult());

    expect(await getLatestPassingContrastSha()).toBe(newerPass.sha);
  });
});
