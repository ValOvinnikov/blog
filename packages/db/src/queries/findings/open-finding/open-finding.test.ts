import {
  ERROR_CODE,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { openFinding } from './open-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query this function builds still runs as real SQL (see
// src/testing/create-test-db.ts), so the partial unique index under test is
// the real Postgres constraint, not a mocked stand-in.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.findings);
  await db.delete(schema.tenants);
});

describe(openFinding, () => {
  it('inserts a fresh OPEN finding when none exists for the condition', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'acme.example.com',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        finding: expect.objectContaining({
          tenantId,
          source: FINDING_SOURCE.DOMAIN_VERIFICATION,
          kind: FINDING_KIND.DOMAIN_NOT_ADDED,
          severity: FINDING_SEVERITY.WARNING,
          status: FINDING_STATUS.OPEN,
        }),
        isNewlyOpened: true,
      },
    });
  });

  it('detecting the same condition twice yields one open row, not two', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const input = {
      tenantId,
      source: FINDING_SOURCE.RECHECK_TENANT_OWNERS,
      kind: FINDING_KIND.OWNER_CHECK_STALLED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'owner-elevation',
    };

    const first = await openFinding(input);
    const second = await openFinding({
      ...input,
      severity: FINDING_SEVERITY.CRITICAL,
      details: { attempts: 2 },
    });

    expect(first.ok).toBe(true);
    expect(second).toEqual({
      ok: true,
      data: {
        finding: expect.objectContaining({
          severity: FINDING_SEVERITY.CRITICAL,
          details: { attempts: 2 },
          status: FINDING_STATUS.OPEN,
        }),
        isNewlyOpened: false,
      },
    });

    const rows = await db
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.tenantId, tenantId));
    expect(rows).toHaveLength(1);
  });

  it('bumps lastSeenAt without changing firstSeenAt on a repeat sighting', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const input = {
      tenantId,
      source: FINDING_SOURCE.DOCUMENT_VALIDATION,
      kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
      severity: FINDING_SEVERITY.INFO,
      identifier: 'doc-1',
    };

    const first = await openFinding(input);
    const second = await openFinding(input);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.data.finding.firstSeenAt).toEqual(
      first.data.finding.firstSeenAt,
    );
    expect(second.data.finding.lastSeenAt.getTime()).toBeGreaterThanOrEqual(
      first.data.finding.lastSeenAt.getTime(),
    );
  });

  it('reopens as a new row once the prior finding for the same condition was resolved', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const input = {
      tenantId,
      source: FINDING_SOURCE.SITE_CONFIG_REVALIDATION,
      kind: FINDING_KIND.REVALIDATION_FAILED,
      severity: FINDING_SEVERITY.CRITICAL,
      identifier: 'homepage',
    };

    const first = await openFinding(input);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await db
      .update(schema.findings)
      .set({ status: FINDING_STATUS.RESOLVED, resolvedAt: new Date() })
      .where(eq(schema.findings.id, first.data.finding.id));

    const second = await openFinding(input);

    expect(second).toEqual({
      ok: true,
      data: { finding: expect.anything(), isNewlyOpened: true },
    });
    const rows = await db
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.tenantId, tenantId));
    expect(rows).toHaveLength(2);
  });

  it('supports a nullable tenantId for a platform-wide condition', async () => {
    const result = await openFinding({
      source: FINDING_SOURCE.TENANT_PROVISIONING,
      kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
      severity: FINDING_SEVERITY.CRITICAL,
      identifier: 'global-check',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        finding: expect.objectContaining({ tenantId: null }),
        isNewlyOpened: true,
      },
    });
  });

  it('returns DB_NOT_FOUND when the open row vanishes before the follow-up update', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const input = {
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'race.example.com',
    };
    await openFinding(input);

    const insertSpy = vi.spyOn(db, 'insert').mockReturnValueOnce({
      values: () => ({
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
      }),
    } as unknown as ReturnType<typeof db.insert>);
    const updateSpy = vi.spyOn(db, 'update').mockReturnValueOnce({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    } as unknown as ReturnType<typeof db.update>);

    const result = await openFinding(input);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    insertSpy.mockRestore();
    updateSpy.mockRestore();
  });
});

describe('foreign-key cascade', () => {
  it('removes a finding when its owning tenant is deleted', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'acme.example.com',
    });

    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db.select().from(schema.findings);
    expect(rows).toHaveLength(0);
  });
});
