import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  makeContrastResult,
  makePassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { listOpenFindings } from '../list-open-findings';

import { recordContrastResult } from './record-contrast-result';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(recordContrastResult, () => {
  it('records a failing run as an open, platform-wide critical finding', async () => {
    const failingRun = makeContrastResult();

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
    const finding = await recordContrastResult(makePassingContrastResult());

    expect(finding.status).toBe(FINDING_STATUS.RESOLVED);
    expect(finding.resolvedAt).toBeInstanceOf(Date);
    expect(await listOpenFindings()).toEqual([]);
  });

  it('closes a failing SHA on a later passing run and keeps the same row', async () => {
    const failingRun = makeContrastResult();
    const passingRun = makePassingContrastResult({ sha: failingRun.sha });

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
    const passingRun = makePassingContrastResult();

    const passed = await recordContrastResult(passingRun);
    const failed = await recordContrastResult(
      makeContrastResult({ sha: passingRun.sha }),
    );

    expect(failed).toEqual(
      expect.objectContaining({
        id: passed.id,
        status: FINDING_STATUS.OPEN,
        resolvedAt: null,
      }),
    );
  });

  it('keeps a recorded tag when a re-run carries none', async () => {
    const tag = `v${faker.system.semver()}`;
    const passingRun = makePassingContrastResult();

    await recordContrastResult({ ...passingRun, tag });
    const rerun = await recordContrastResult(passingRun);

    expect(rerun.details).toEqual({ ...passingRun, tag });
  });

  it('keeps each SHA on its own row', async () => {
    await recordContrastResult(makeContrastResult());
    await recordContrastResult(makePassingContrastResult());

    expect(await db().select().from(schema.findings)).toHaveLength(2);
  });
});
