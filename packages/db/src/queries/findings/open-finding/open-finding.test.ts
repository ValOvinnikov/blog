import { faker } from '@faker-js/faker';
import {
  ERROR_CODE,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { buildDedupeKey } from '@shinefold/db/queries/findings/build-dedupe-key';
import type { TOpenFindingInput } from '@shinefold/db/queries/findings/open-finding';
import { resolveFinding } from '@shinefold/db/queries/findings/resolve-finding';
import * as schema from '@shinefold/db/schema';
import type { TFinding } from '@shinefold/db/schema/findings';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_NOW,
  mockOpenFindingInput,
} from '@shinefold/db/testing/findings/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import { openFinding } from './open-finding';

faker.seed(6021009);

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await db().delete(schema.findings);
});

describe(openFinding, () => {
  let input: TOpenFindingInput;

  beforeEach(async () => {
    input = mockOpenFindingInput({ tenantId: tenant().id });
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
      tenantId: tenant().id,
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
      tenantId: tenant().id,
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
      .where(eq(schema.findings.tenantId, tenant().id));
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
      .where(eq(schema.findings.tenantId, tenant().id));
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

    it('returns DB_NOT_FOUND when the open row vanishes before the follow-up update', async () => {
      vi.spyOn(db(), 'update').mockReturnValueOnce({
        set: () => ({
          where: () => ({ returning: () => Promise.resolve([]) }),
        }),
      } as unknown as ReturnType<ReturnType<typeof db>['update']>);

      const result = await openFinding(input);

      expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    });

    it('removes a finding when its owning tenant is deleted', async () => {
      await db()
        .delete(schema.tenants)
        .where(eq(schema.tenants.id, tenant().id));

      const rows = await db().select().from(schema.findings);
      expect(rows).toHaveLength(0);
    });
  });
});
