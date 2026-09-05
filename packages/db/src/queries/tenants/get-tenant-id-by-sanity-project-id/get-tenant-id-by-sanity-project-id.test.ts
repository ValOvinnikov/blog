import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantIdBySanityProjectId } from './get-tenant-id-by-sanity-project-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(sanityProjectId: string | null): Promise<string> {
  const tenant = await insertTestTenant(db, {
    sanityProjectId,
    sanityDataset: sanityProjectId ? 'production' : null,
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

  it('rejects a second tenant sharing an already-used sanityProjectId', async () => {
    await insertTenant('abc123');

    await expect(insertTenant('abc123')).rejects.toThrow();
  });

  it('allows more than one tenant to have a null sanityProjectId', async () => {
    await insertTenant(null);
    await insertTenant(null);

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBeUndefined();
  });
});
