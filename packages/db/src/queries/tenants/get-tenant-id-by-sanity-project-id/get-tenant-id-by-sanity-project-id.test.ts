import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantIdBySanityProjectId } from './get-tenant-id-by-sanity-project-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(
  sanityProjectId: string | null,
  createdAt?: Date,
): Promise<string> {
  const tenant = await insertTestTenant(db, {
    sanityProjectId,
    sanityDataset: sanityProjectId ? 'production' : null,
    ...(createdAt ? { createdAt } : {}),
  });
  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(getTenantIdBySanityProjectId, () => {
  it('returns the tenant id for a matching sanityProjectId', async () => {
    const tenantId = await insertTenant('abc123');

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBe(tenantId);
  });

  it('returns undefined when no tenant matches', async () => {
    await insertTenant('abc123');

    const result = await getTenantIdBySanityProjectId('missing');

    expect(result).toBeUndefined();
  });

  it('returns undefined when sanityProjectId is null on every row', async () => {
    await insertTenant(null);

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBeUndefined();
  });

  it('deterministically resolves to the earliest-created match when more than one tenant shares a sanityProjectId', async () => {
    const olderTenantId = await insertTenant('abc123', new Date('2026-01-01'));
    await insertTenant('abc123', new Date('2026-02-01'));

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBe(olderTenantId);
  });
});
