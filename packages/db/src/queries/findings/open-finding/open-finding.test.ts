import {
  ERROR_CODE,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { buildDedupeKey } from '@blog/db/queries/findings/build-dedupe-key';
import type { TOpenFindingInput } from '@blog/db/queries/findings/open-finding';
import * as schema from '@blog/db/schema';
import type { TFinding } from '@blog/db/schema/findings';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_NOW,
  mockOpenFindingInput,
} from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { resolveFinding } from '../resolve-finding';

import { openFinding } from './open-finding';

faker.seed(6021009);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(openFinding, () => {
  let tenantId: string;
  let input: TOpenFindingInput;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    input = mockOpenFindingInput({ tenantId });
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
  });

  async function openOnlyFinding(
    findingInput: TOpenFindingInput,
  ): Promise<TMaybeUndefined<TFinding>> {
    const result = await openFinding(findingInput);

    const [row] = await db().select().from(schema.findings);
    expect(result).toEqual({
      ok: true,
      data: { finding: row, isNewlyOpened: true },
    });
    return row;
  }

  it('inserts a fresh OPEN finding when none exists for the condition', async () => {
    const row = await openOnlyFinding(input);

    expect(row).toEqual({
      id: row?.id,
      tenantId,
      source: input.source,
      kind: input.kind,
      severity: input.severity,
      status: FINDING_STATUS.OPEN,
      dedupeKey: buildDedupeKey(input),
      details: null,
      firstSeenAt: MOCK_FINDING_NOW,
      lastSeenAt: MOCK_FINDING_NOW,
      resolvedAt: null,
    });
  });

  it('detecting the same condition twice yields one open row, not two', async () => {
    const stalledInput = mockOpenFindingInput({
      tenantId,
      source: FINDING_SOURCE.RECHECK_TENANT_OWNERS,
      kind: FINDING_KIND.OWNER_CHECK_STALLED,
    });
    const details = { attempts: faker.number.int({ min: 2, max: 9 }) };

    await openFinding(stalledInput);
    const second = await openFinding({
      ...stalledInput,
      severity: FINDING_SEVERITY.CRITICAL,
      details,
    });

    const rows = await db()
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.tenantId, tenantId));
    expect(second).toEqual({
      ok: true,
      data: {
        finding: {
          ...rows[0],
          severity: FINDING_SEVERITY.CRITICAL,
          details,
          status: FINDING_STATUS.OPEN,
        },
        isNewlyOpened: false,
      },
    });
    expect(rows).toHaveLength(1);
  });

  it('reopens as a new row once the prior finding for the same condition was resolved', async () => {
    const first = await openFinding(input);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await resolveFinding(first.data.finding.id);

    const second = await openFinding(input);

    const rows = await db()
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.tenantId, tenantId));
    const reopened = rows.find(({ id }) => id !== first.data.finding.id);
    expect(second).toEqual({
      ok: true,
      data: { finding: reopened, isNewlyOpened: true },
    });
    expect(rows).toHaveLength(2);
  });

  it('supports a nullable tenantId for a platform-wide condition', async () => {
    const row = await openOnlyFinding(
      mockOpenFindingInput({
        source: FINDING_SOURCE.TENANT_PROVISIONING,
        kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
      }),
    );

    expect(row?.tenantId).toBeNull();
  });

  it('returns DB_NOT_FOUND when the open row vanishes before the follow-up update', async () => {
    vi.spyOn(db(), 'insert').mockReturnValueOnce({
      values: () => ({
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
      }),
    } as unknown as ReturnType<ReturnType<typeof db>['insert']>);

    const result = await openFinding(input);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });

  describe('with the finding already open', () => {
    beforeEach(async () => {
      await openFinding(input);
    });

    it('bumps lastSeenAt without changing firstSeenAt on a repeat sighting', async () => {
      vi.setSystemTime(MOCK_FINDING_LATER_AT);
      const second = await openFinding(input);

      expect(second.ok).toBe(true);
      if (!second.ok) return;
      const { firstSeenAt, lastSeenAt } = second.data.finding;
      expect(firstSeenAt).toEqual(MOCK_FINDING_NOW);
      expect(lastSeenAt).toEqual(MOCK_FINDING_LATER_AT);
    });

    it('removes a finding when its owning tenant is deleted', async () => {
      await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

      const rows = await db().select().from(schema.findings);
      expect(rows).toHaveLength(0);
    });
  });
});
