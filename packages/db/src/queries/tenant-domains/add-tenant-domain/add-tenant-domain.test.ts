import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addTenantDomain } from './add-tenant-domain';

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
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
});

describe(addTenantDomain, () => {
  it('inserts a new domain row for the given tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });

    const result = await addTenantDomain(tenantId, 'acme.example.com');

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        tenantId,
        domain: 'acme.example.com',
      }),
    });
  });

  it('is idempotent when the same (tenantId, domain) pair is added again', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
    const first = await addTenantDomain(tenantId, 'acme.example.com');

    const second = await addTenantDomain(tenantId, 'acme.example.com');

    expect(second).toEqual(first);
    const rows = await db.select().from(schema.tenantDomains);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_DUPLICATE_DOMAIN for a domain already assigned to a different tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
    const { id: otherTenantId } = await insertTestTenant(db, {
      slug: 'other',
      primaryDomain: 'other.example.com',
    });
    await addTenantDomain(tenantId, 'shared.example.com');

    const result = await addTenantDomain(otherTenantId, 'shared.example.com');

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    });
  });

  // pglite serves a single connection, so a real concurrent DELETE landing
  // between this call's no-op insert and its follow-up read can't be forced
  // here — `updateTenantDetails` rewriting a row's `domain` value is the
  // real-world trigger. The follow-up read is spied to simulate that exact
  // window instead.
  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
    await addTenantDomain(tenantId, 'shared.example.com');

    const selectSpy = vi.spyOn(db, 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await addTenantDomain(tenantId, 'shared.example.com');

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});

describe('foreign-key cascade', () => {
  it('removes a tenant_domains row when its owning tenant is deleted', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
    await addTenantDomain(tenantId, 'acme.example.com');

    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db.select().from(schema.tenantDomains);
    expect(rows).toHaveLength(0);
  });
});
