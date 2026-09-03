import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createTenant, type TCreateTenantInput } from './create-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const tenantInput: TCreateTenantInput = {
  name: 'Acme',
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
    const result = await createTenant(tenantInput);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data).toMatchObject(tenantInput);
    expect(result.data.id).toEqual(expect.any(String));
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme.com'],
    ['a trailing-slash value', 'acme.com/'],
    ['a whitespace-padded value', ' acme.com '],
  ])(
    'rejects %s for primaryDomain without writing a row',
    async (_description, primaryDomain) => {
      const result = await createTenant({ ...tenantInput, primaryDomain });

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      });

      const rows = await db.select().from(schema.tenants);
      expect(rows).toHaveLength(0);
    },
  );
});
