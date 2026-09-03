import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantsByIds } from './list-tenants-by-ids';

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
  await db.delete(schema.tenants);
});

describe(listTenantsByIds, () => {
  it('returns an empty array without querying when given no ids', async () => {
    const result = await listTenantsByIds([]);

    expect(result).toEqual([]);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it('silently omits ids with no matching row', async () => {
    const { id: acmeId } = await insertTestTenant(db, { name: 'Acme' });

    const result = await listTenantsByIds([
      acmeId,
      '00000000-0000-0000-0000-000000000000',
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Acme' });
  });

  it('resolves multiple ids to their tenants', async () => {
    const { id: acmeId } = await insertTestTenant(db, { name: 'Acme' });
    const { id: zetaId } = await insertTestTenant(db, { name: 'Zeta' });

    const result = await listTenantsByIds([acmeId, zetaId]);

    expect(result.map((tenant) => tenant.name).sort()).toEqual([
      'Acme',
      'Zeta',
    ]);
  });
});
