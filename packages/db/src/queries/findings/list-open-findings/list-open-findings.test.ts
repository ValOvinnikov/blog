import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { openFinding } from '../open-finding';
import { resolveFinding } from '../resolve-finding';

import { listOpenFindings } from './list-open-findings';

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

describe(listOpenFindings, () => {
  it('returns open findings across every tenant, excluding resolved ones', async () => {
    const { id: tenantOneId } = await insertTestTenant(db, { slug: 'acme' });
    const { id: tenantTwoId } = await insertTestTenant(db, { slug: 'globex' });
    const resolved = await openFinding({
      tenantId: tenantOneId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'resolved-one',
    });
    await openFinding({
      tenantId: tenantTwoId,
      source: FINDING_SOURCE.TENANT_PROVISIONING,
      kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
      severity: FINDING_SEVERITY.CRITICAL,
      identifier: 'still-open',
    });
    await openFinding({
      source: FINDING_SOURCE.RECHECK_TENANT_OWNERS,
      kind: FINDING_KIND.OWNER_CHECK_AMBIGUOUS,
      severity: FINDING_SEVERITY.INFO,
      identifier: 'platform-wide',
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    await resolveFinding(resolved.data.finding.id);

    const result = await listOpenFindings();

    expect(result).toHaveLength(2);
    expect(
      result.some((finding) => finding.id === resolved.data.finding.id),
    ).toBe(false);
  });

  it('returns an empty array when nothing is open', async () => {
    const result = await listOpenFindings();

    expect(result).toEqual([]);
  });
});
