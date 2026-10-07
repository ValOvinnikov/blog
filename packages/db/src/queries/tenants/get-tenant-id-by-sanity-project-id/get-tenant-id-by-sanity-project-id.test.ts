import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantIdBySanityProjectId } from './get-tenant-id-by-sanity-project-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function insertTenant(sanityProjectId: string | null): Promise<string> {
  const tenant = await insertTestTenant(db(), {
    sanityProjectId,
    sanityDataset: sanityProjectId ? 'production' : null,
  });
  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantIdBySanityProjectId, () => {
  describe('a tenant with sanityProjectId abc123', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenant('abc123');
    });

    it('returns the tenant id for a matching sanityProjectId', async () => {
      const result = await getTenantIdBySanityProjectId('abc123');

      expect(result).toBe(tenantId);
    });

    it('returns undefined when no tenant matches', async () => {
      const result = await getTenantIdBySanityProjectId('missing');

      expect(result).toBeUndefined();
    });

    it('rejects a second tenant sharing an already-used sanityProjectId', async () => {
      await expect(insertTenant('abc123')).rejects.toThrow();
    });
  });

  describe('a tenant with a null sanityProjectId', () => {
    beforeEach(async () => {
      await insertTenant(null);
    });

    it('returns undefined when sanityProjectId is null on every row', async () => {
      const result = await getTenantIdBySanityProjectId('abc123');

      expect(result).toBeUndefined();
    });

    it('allows more than one tenant to have a null sanityProjectId', async () => {
      await insertTenant(null);

      const result = await getTenantIdBySanityProjectId('abc123');

      expect(result).toBeUndefined();
    });
  });
});
