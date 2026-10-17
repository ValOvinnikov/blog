import * as schema from '@blog/db/schema';
import {
  makeContrastResult,
  makePassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { recordContrastResult } from '../record-contrast-result';

import { getLatestPassingContrastSha } from './get-latest-passing-contrast-sha';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(getLatestPassingContrastSha, () => {
  it('returns undefined when no run has passed', async () => {
    await recordContrastResult(makeContrastResult());

    expect(await getLatestPassingContrastSha()).toBeUndefined();
  });

  it('returns the SHA of the newest passing run, ignoring a newer failure', async () => {
    const newerPass = makePassingContrastResult();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    await recordContrastResult(makePassingContrastResult());
    vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
    await recordContrastResult(newerPass);
    vi.setSystemTime(new Date('2026-10-03T10:00:00Z'));
    await recordContrastResult(makeContrastResult());

    expect(await getLatestPassingContrastSha()).toBe(newerPass.sha);
  });
});
