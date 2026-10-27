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
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';
import { faker } from '@faker-js/faker';

import { deleteResolvedFindingsPastRetention } from './delete-resolved-findings-past-retention';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

faker.seed(6022);

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
        dedupeKey: faker.string.uuid(),
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

    const deleted = await deleteResolvedFindingsPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(1);
    expect(remaining).toEqual([recentId]);
  });

  it('never deletes an open finding, however old', async () => {
    const openId = await insertFinding({
      status: FINDING_STATUS.OPEN,
      firstSeenAt: justPast(CUTOFF),
      lastSeenAt: justPast(CUTOFF),
    });

    const deleted = await deleteResolvedFindingsPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(0);
    expect(remaining).toEqual([openId]);
  });

  it('deletes at most the given number of findings per call', async () => {
    await insertFinding({ resolvedAt: justPast(CUTOFF) });
    await insertFinding({ resolvedAt: justPast(CUTOFF) });

    const deleted = await deleteResolvedFindingsPastRetention(
      MOCK_RETENTION_NOW,
      1,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(1);
    expect(remaining).toHaveLength(1);
  });

  it('deletes nothing when run a second time', async () => {
    await insertFinding({ resolvedAt: justPast(CUTOFF) });
    await deleteResolvedFindingsPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );

    await expect(
      deleteResolvedFindingsPastRetention(
        MOCK_RETENTION_NOW,
        MOCK_RETENTION_LIMIT,
      ),
    ).resolves.toBe(0);
  });
});
