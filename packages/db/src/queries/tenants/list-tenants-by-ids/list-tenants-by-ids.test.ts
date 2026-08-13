import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantsByIds } from './list-tenants-by-ids';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
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

describe(listTenantsByIds, () => {
  it('returns an empty array without querying when given no ids', async () => {
    const result = await listTenantsByIds([]);

    expect(result).toEqual([]);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it('silently omits ids with no matching row', async () => {
    const acmeId = await insertTenant('acme');

    const result = await listTenantsByIds([
      acmeId,
      '00000000-0000-0000-0000-000000000000',
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ slug: 'acme' });
  });

  it('resolves multiple ids to their tenants', async () => {
    const acmeId = await insertTenant('acme');
    const zetaId = await insertTenant('zeta');

    const result = await listTenantsByIds([acmeId, zetaId]);

    expect(result.map((tenant) => tenant.slug).sort()).toEqual([
      'acme',
      'zeta',
    ]);
  });
});
