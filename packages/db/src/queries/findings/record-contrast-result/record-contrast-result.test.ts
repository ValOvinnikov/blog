import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { listOpenFindings } from '@blog/db/queries/findings/list-open-findings';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_NOW,
  mockContrastResult,
  mockPassingContrastResult,
  mockReleaseTag,
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
});
