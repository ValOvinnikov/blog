import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { listOpenFindings } from '@blog/db/queries/findings/list-open-findings';
import * as schema from '@blog/db/schema';
import {
  mockContrastResult,
  mockPassingContrastResult,
} from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { recordContrastResult } from './record-contrast-result';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(recordContrastResult, () => {
  let failingRun: TContrastResultBody;
  let passingRun: TContrastResultBody;

  beforeEach(() => {
    failingRun = mockContrastResult();
    passingRun = mockPassingContrastResult();
  });

  it('records a failing run as an open, platform-wide critical finding', async () => {
    const finding = await recordContrastResult(failingRun);

    const { tenantId, source, kind, severity, status, resolvedAt, details } =
      finding;
    expect(tenantId).toBeNull();
    expect(source).toBe(FINDING_SOURCE.CONTRAST_CHECK);
    expect(kind).toBe(FINDING_KIND.CONTRAST_REGRESSION);
    expect(severity).toBe(FINDING_SEVERITY.CRITICAL);
    expect(status).toBe(FINDING_STATUS.OPEN);
    expect(resolvedAt).toBeNull();
    expect(details).toEqual(failingRun);
    const openFindings = await listOpenFindings();
    expect(openFindings.map(({ id }) => id)).toEqual([finding.id]);
  });

  it('records a passing run as resolved without listing it among open findings', async () => {
    const finding = await recordContrastResult(passingRun);

    expect(finding.status).toBe(FINDING_STATUS.RESOLVED);
    expect(finding.resolvedAt).toBeInstanceOf(Date);
    expect(await listOpenFindings()).toEqual([]);
  });

  it('closes a failing SHA on a later passing run and keeps the same row', async () => {
    const laterPassingRun = mockPassingContrastResult({ sha: failingRun.sha });

    const failed = await recordContrastResult(failingRun);
    const passed = await recordContrastResult(laterPassingRun);

    expect(passed.id).toBe(failed.id);
    expect(passed.status).toBe(FINDING_STATUS.RESOLVED);
    expect(passed.details).toEqual(laterPassingRun);
    expect(await db().select().from(schema.findings)).toHaveLength(1);
    expect(await listOpenFindings()).toEqual([]);
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
    const tag = `v${faker.system.semver()}`;

    await recordContrastResult({ ...passingRun, tag });
    const rerun = await recordContrastResult(passingRun);

    expect(rerun.details).toEqual({ ...passingRun, tag });
  });

  it('keeps each SHA on its own row', async () => {
    await recordContrastResult(failingRun);
    await recordContrastResult(passingRun);

    expect(await db().select().from(schema.findings)).toHaveLength(2);
  });
});
