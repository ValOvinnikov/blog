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
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { openFinding } from '../open-finding';

import { resolveFinding } from './resolve-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

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

describe(resolveFinding, () => {
  it('marks an open finding resolved and stamps resolvedAt', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const opened = await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'acme.example.com',
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const result = await resolveFinding(opened.data.finding.id);

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        id: opened.data.finding.id,
        status: FINDING_STATUS.RESOLVED,
        resolvedAt: expect.any(Date),
      }),
    });
  });

  it('allows the same condition to reopen after being resolved', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const input = {
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'acme.example.com',
    };
    const opened = await openFinding(input);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    await resolveFinding(opened.data.finding.id);

    const reopened = await openFinding(input);

    expect(reopened).toEqual({
      ok: true,
      data: { finding: expect.anything(), isNewlyOpened: true },
    });
  });

  it('returns DB_NOT_FOUND for an id that does not exist', async () => {
    const result = await resolveFinding('00000000-0000-0000-0000-000000000000');

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });

  it('returns DB_NOT_FOUND when the finding is already resolved', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const opened = await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'acme.example.com',
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    await resolveFinding(opened.data.finding.id);

    const result = await resolveFinding(opened.data.finding.id);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
