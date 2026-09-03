import {
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
import { resolveFinding } from '../resolve-finding';

import { listFindingsForTenant } from './list-findings-for-tenant';

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

describe(listFindingsForTenant, () => {
  it('returns only the given tenant’s findings, most recently seen first', async () => {
    const { id: tenantOneId } = await insertTestTenant(db);
    const { id: tenantTwoId } = await insertTestTenant(db);
    const olderInput = {
      tenantId: tenantOneId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'older',
    };
    const newerInput = { ...olderInput, identifier: 'newer' };
    await openFinding(olderInput);
    await openFinding(newerInput);
    await openFinding({
      ...olderInput,
      tenantId: tenantTwoId,
      identifier: 'other-tenant',
    });

    const result = await listFindingsForTenant(tenantOneId);

    expect(result).toHaveLength(2);
    expect(result.every((finding) => finding.tenantId === tenantOneId)).toBe(
      true,
    );
  });

  it('filters by status when given', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const opened = await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'to-resolve',
    });
    await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'stays-open',
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    await resolveFinding(opened.data.finding.id);

    const openOnly = await listFindingsForTenant(tenantId, FINDING_STATUS.OPEN);
    const resolvedOnly = await listFindingsForTenant(
      tenantId,
      FINDING_STATUS.RESOLVED,
    );

    expect(openOnly).toHaveLength(1);
    expect(resolvedOnly).toHaveLength(1);
    expect(resolvedOnly[0]?.id).toBe(opened.data.finding.id);
  });

  it('returns an empty array for a tenant with no findings', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await listFindingsForTenant(tenantId);

    expect(result).toEqual([]);
  });
});
