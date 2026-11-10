import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { getContrastFinding } from '@blog/db/queries/findings/get-contrast-finding';
import { listOpenFindings } from '@blog/db/queries/findings/list-open-findings';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_NOW,
  mockContrastResult,
  mockOpenFindingInput,
  mockPassingContrastResult,
  mockReleaseTag,
  openTestFinding,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { recordContrastResult } from './record-contrast-result';

faker.seed(6021008);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(recordContrastResult, () => {
  let failingRun: TContrastResultBody;
  let passingRun: TContrastResultBody;

  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
    failingRun = mockContrastResult();
    passingRun = mockPassingContrastResult();
  });

  it('records a failing run as an open, platform-wide critical finding', async () => {
    const finding = await recordContrastResult(failingRun);

    const openFindings = await listOpenFindings();
    expect(finding).toEqual({
      id: finding.id,
      tenantId: null,
      source: FINDING_SOURCE.CONTRAST_CHECK,
      kind: FINDING_KIND.CONTRAST_REGRESSION,
      severity: FINDING_SEVERITY.CRITICAL,
      status: FINDING_STATUS.OPEN,
      dedupeKey: buildContrastDedupeKey(failingRun.sha),
      details: failingRun,
      firstSeenAt: MOCK_FINDING_NOW,
      lastSeenAt: MOCK_FINDING_NOW,
      resolvedAt: null,
    });
    expect(openFindings.map(({ id }) => id)).toEqual([finding.id]);
  });

  it('records a passing run as resolved without listing it among open findings', async () => {
    const finding = await recordContrastResult(passingRun);

    const openFindings = await listOpenFindings();
    expect(finding.status).toBe(FINDING_STATUS.RESOLVED);
    expect(finding.resolvedAt).toEqual(MOCK_FINDING_NOW);
    expect(openFindings).toEqual([]);
  });

  it('closes a failing SHA on a later passing run and keeps the same row', async () => {
    const laterPassingRun = mockPassingContrastResult({ sha: failingRun.sha });

    const failed = await recordContrastResult(failingRun);
    vi.setSystemTime(MOCK_FINDING_LATER_AT);
    const passed = await recordContrastResult(laterPassingRun);

    const rows = await db().select().from(schema.findings);
    const openFindings = await listOpenFindings();
    expect(passed).toEqual({
      ...failed,
      status: FINDING_STATUS.RESOLVED,
      details: laterPassingRun,
      lastSeenAt: MOCK_FINDING_LATER_AT,
      resolvedAt: MOCK_FINDING_LATER_AT,
    });
    expect(rows).toEqual([passed]);
    expect(openFindings).toEqual([]);
  });

  it('reopens the same row when a passing SHA later fails', async () => {
    const passed = await recordContrastResult(passingRun);
    const failed = await recordContrastResult(
      mockContrastResult({ sha: passingRun.sha }),
    );

    expect(failed.id).toBe(passed.id);
    expect(failed.status).toBe(FINDING_STATUS.OPEN);
    expect(failed.resolvedAt).toBeNull();
  });

  it('keeps a recorded tag when a re-run carries none', async () => {
    const tag = mockReleaseTag();

    await recordContrastResult({ ...passingRun, tag });
    const rerun = await recordContrastResult(passingRun);

    expect(rerun.details).toEqual({ ...passingRun, tag });
  });

  it('keeps each SHA on its own row', async () => {
    await recordContrastResult(failingRun);
    await recordContrastResult(passingRun);

    const rows = await db().select().from(schema.findings);
    expect(rows).toHaveLength(2);
  });

  it('resolves every older open failure when another SHA passes', async () => {
    const olderRuns = [failingRun, mockContrastResult()];
    const olderFailures = await Promise.all(
      olderRuns.map(recordContrastResult),
    );
    vi.setSystemTime(MOCK_FINDING_LATER_AT);

    await recordContrastResult(passingRun);

    const superseded = await Promise.all(
      olderRuns.map(({ sha }) => getContrastFinding(sha)),
    );
    expect(superseded).toEqual(
      olderFailures.map((failed, index) => ({
        ...failed,
        status: FINDING_STATUS.RESOLVED,
        details: { ...olderRuns[index], supersededBy: passingRun.sha },
        resolvedAt: MOCK_FINDING_LATER_AT,
        hasPassed: false,
      })),
    );
    expect(await listOpenFindings()).toEqual([]);
  });

  it('drops the superseding SHA once a superseded SHA passes its own run', async () => {
    const ownPass = mockPassingContrastResult({ sha: failingRun.sha });
    await recordContrastResult(failingRun);
    await recordContrastResult(passingRun);
    vi.setSystemTime(MOCK_FINDING_LATER_AT);

    const passed = await recordContrastResult(ownPass);

    expect(passed.details).toEqual(ownPass);
  });

  it('leaves other open failures and resolved findings as they were when a SHA fails', async () => {
    const earlierPass = await recordContrastResult(passingRun);
    const earlierFailure = await recordContrastResult(mockContrastResult());

    const failed = await recordContrastResult(failingRun);

    const openFindings = await listOpenFindings();
    expect(await getContrastFinding(passingRun.sha)).toEqual({
      ...earlierPass,
      hasPassed: true,
    });
    expect(openFindings.map(({ id }) => id).sort()).toEqual(
      [earlierFailure.id, failed.id].sort(),
    );
  });

  it('leaves findings from other sources open when a SHA passes', async () => {
    const otherFinding = await openTestFinding(mockOpenFindingInput());

    await recordContrastResult(passingRun);

    const openFindings = await listOpenFindings();
    expect(openFindings.map(({ id }) => id)).toEqual([otherFinding.id]);
  });
});
