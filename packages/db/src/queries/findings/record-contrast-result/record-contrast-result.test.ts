import {
  CONTRAST_CHECK_OUTCOME,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listOpenFindings } from '../list-open-findings';

import { recordContrastResult } from './record-contrast-result';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const failingRun: TContrastResultBody = {
  sha: 'abc123',
  outcome: CONTRAST_CHECK_OUTCOME.FAIL,
  failureCount: 3,
  runUrl: 'https://github.com/example/runs/1',
};

const passingRun: TContrastResultBody = {
  ...failingRun,
  outcome: CONTRAST_CHECK_OUTCOME.PASS,
  failureCount: 0,
  runUrl: 'https://github.com/example/runs/2',
};

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(recordContrastResult, () => {
  it('records a failing run as an open, platform-wide critical finding', async () => {
    const finding = await recordContrastResult(failingRun);

    expect(finding).toEqual(
      expect.objectContaining({
        tenantId: null,
        source: FINDING_SOURCE.CONTRAST_CHECK,
        kind: FINDING_KIND.CONTRAST_REGRESSION,
        severity: FINDING_SEVERITY.CRITICAL,
        status: FINDING_STATUS.OPEN,
        resolvedAt: null,
        details: failingRun,
      }),
    );
    expect(await listOpenFindings()).toEqual([
      expect.objectContaining({ id: finding.id }),
    ]);
  });

  it('records a passing run as resolved without listing it among open findings', async () => {
    const finding = await recordContrastResult(passingRun);

    expect(finding.status).toBe(FINDING_STATUS.RESOLVED);
    expect(finding.resolvedAt).toBeInstanceOf(Date);
    expect(await listOpenFindings()).toEqual([]);
  });

  it('closes a failing SHA on a later passing run and keeps the same row', async () => {
    const failed = await recordContrastResult(failingRun);
    const passed = await recordContrastResult(passingRun);

    expect(passed).toEqual(
      expect.objectContaining({
        id: failed.id,
        status: FINDING_STATUS.RESOLVED,
        details: passingRun,
      }),
    );
    expect(await db().select().from(schema.findings)).toHaveLength(1);
    expect(await listOpenFindings()).toEqual([]);
  });

  it('reopens the same row when a passing SHA later fails', async () => {
    const passed = await recordContrastResult(passingRun);
    const failed = await recordContrastResult(failingRun);

    expect(failed).toEqual(
      expect.objectContaining({
        id: passed.id,
        status: FINDING_STATUS.OPEN,
        resolvedAt: null,
      }),
    );
  });

  it('keeps a recorded tag when a re-run carries none', async () => {
    await recordContrastResult({ ...passingRun, tag: 'v1.2.0' });
    const rerun = await recordContrastResult(passingRun);

    expect(rerun.details).toEqual({ ...passingRun, tag: 'v1.2.0' });
  });

  it('keeps each SHA on its own row', async () => {
    await recordContrastResult(failingRun);
    await recordContrastResult({ ...passingRun, sha: 'def456' });

    expect(await db().select().from(schema.findings)).toHaveLength(2);
  });
});
