import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createTenant, type TCreateTenantInput } from './create-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const tenantInput: TCreateTenantInput = {
  slug: 'acme',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'abc123',
  sanityDataset: 'production',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
  status: TENANT_STATUS.ACTIVE,
};

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(createTenant, () => {
  it('inserts a new tenant row', async () => {
    const tenant = await createTenant(tenantInput);

    expect(tenant).toMatchObject(tenantInput);
    expect(tenant.id).toEqual(expect.any(String));
  });

  it('rejects a second tenant with an already-used slug', async () => {
    await createTenant(tenantInput);

    await expect(
      createTenant({ ...tenantInput, primaryDomain: 'other.example.com' }),
    ).rejects.toThrow();
  });
});
