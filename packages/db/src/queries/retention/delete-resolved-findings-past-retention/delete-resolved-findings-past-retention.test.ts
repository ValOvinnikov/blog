import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import { RESOLVED_FINDING_RETENTION_DAYS } from '@blog/db/constants';
import { daysBefore } from '@blog/db/queries/retention/retention-cutoff';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';

import { deleteResolvedFindingsPastRetention } from './delete-resolved-findings-past-retention';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const CUTOFF = daysBefore(MOCK_RETENTION_NOW, RESOLVED_FINDING_RETENTION_DAYS);

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(deleteResolvedFindingsPastRetention, () => {
  async function insertFinding(
    overrides: Partial<typeof schema.findings.$inferInsert>,
  ): Promise<string> {
    const [finding] = await db()
      .insert(schema.findings)
      .values({
        source: FINDING_SOURCE.DOMAIN_VERIFICATION,
        kind: FINDING_KIND.DOMAIN_NOT_ADDED,
        severity: FINDING_SEVERITY.WARNING,
        status: FINDING_STATUS.RESOLVED,
        dedupeKey: crypto.randomUUID(),
        ...overrides,
      })
      .returning({ id: schema.findings.id });
    if (!finding) throw new Error('insertFinding: insert returned no row.');
    return finding.id;
  }

  async function remainingIds(): Promise<string[]> {
    const rows = await db()
      .select({ id: schema.findings.id })
      .from(schema.findings);
    return rows.map(({ id }) => id);
  }

  it('deletes the findings resolved before the period and keeps newer ones', async () => {
    await insertFinding({ resolvedAt: justPast(CUTOFF) });
    const recentId = await insertFinding({ resolvedAt: justWithin(CUTOFF) });

    await expect(
      deleteResolvedFindingsPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(1);
    expect(await remainingIds()).toEqual([recentId]);
  });

  it('never deletes an open finding, however old', async () => {
    const openId = await insertFinding({
      status: FINDING_STATUS.OPEN,
      firstSeenAt: justPast(CUTOFF),
      lastSeenAt: justPast(CUTOFF),
    });

    await expect(
      deleteResolvedFindingsPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
    expect(await remainingIds()).toEqual([openId]);
  });

  it('deletes nothing when run a second time', async () => {
    await insertFinding({ resolvedAt: justPast(CUTOFF) });
    await deleteResolvedFindingsPastRetention(MOCK_RETENTION_NOW);

    await expect(
      deleteResolvedFindingsPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
  });
});
