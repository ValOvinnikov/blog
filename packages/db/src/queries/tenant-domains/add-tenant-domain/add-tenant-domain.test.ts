import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { addTenantDomain } from './add-tenant-domain';

vi.mock('@blog/db/client');

const MOCK_SHARED_DOMAIN = 'shared.example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(addTenantDomain, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it('inserts a new domain row for the given tenant', async () => {
    const result = await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        tenantId,
        domain: MOCK_TENANT_DOMAIN,
      }),
    });
  });

  it('is idempotent when the same (tenantId, domain) pair is added again', async () => {
    const first = await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    const second = await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    expect(second).toEqual(first);
    const rows = await db().select().from(schema.tenantDomains);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_DUPLICATE_DOMAIN for a domain already assigned to a different tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: 'other.example.com',
    });
    await addTenantDomain(tenantId, MOCK_SHARED_DOMAIN);

    const result = await addTenantDomain(otherTenantId, MOCK_SHARED_DOMAIN);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    });
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    await addTenantDomain(tenantId, MOCK_SHARED_DOMAIN);

    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await addTenantDomain(tenantId, MOCK_SHARED_DOMAIN);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme.com'],
    ['a trailing-slash value', 'acme.com/'],
    ['a whitespace-padded value', ' acme.com '],
  ])(
    'rejects %s for domain without writing a row',
    async (_description, domain) => {
      const result = await addTenantDomain(tenantId, domain);

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      });

      const rows = await db().select().from(schema.tenantDomains);
      expect(rows).toHaveLength(0);
    },
  );
});

describe('foreign-key cascade', () => {
  it('removes a tenant_domains row when its owning tenant is deleted', async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    });
    await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db().select().from(schema.tenantDomains);
    expect(rows).toHaveLength(0);
  });
});
