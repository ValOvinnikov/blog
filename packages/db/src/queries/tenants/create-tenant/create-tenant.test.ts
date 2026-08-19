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
  slug: 'acme',
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

  it('returns DB_DUPLICATE_SLUG for a second tenant with an already-used slug', async () => {
    await createTenant(tenantInput);

    const result = await createTenant({
      ...tenantInput,
      primaryDomain: 'other.example.com',
    });

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_SLUG,
    });

    const rows = await db.select().from(schema.tenants);
    expect(rows).toHaveLength(1);
  });

  // pglite serves a single connection, so a real concurrent UPDATE landing
  // between this call's no-op insert and its follow-up read can't be
  // forced here — `updateTenantDetails` renaming the slug away is the
  // real-world trigger. The follow-up read is spied to simulate that exact
  // window.
  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    await createTenant(tenantInput);

    const selectSpy = vi.spyOn(db, 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await createTenant(tenantInput);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});
