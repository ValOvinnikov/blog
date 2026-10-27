import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_SHARED_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { addTenantDomain } from './add-tenant-domain';

vi.mock('@blog/db/client');

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

    const rows = await db().select().from(schema.tenantDomains);
    expect(result).toEqual({ ok: true, data: rows[0] });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tenantId).toBe(tenantId);
    expect(rows[0]?.domain).toBe(MOCK_TENANT_DOMAIN);
  });

  it('is idempotent for the same tenant and domain', async () => {
    const first = await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    const second = await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    const rows = await db().select().from(schema.tenantDomains);
    expect(second).toEqual(first);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_DUPLICATE_DOMAIN for a domain owned by another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    });
    await addTenantDomain(tenantId, MOCK_SHARED_TENANT_DOMAIN);

    const result = await addTenantDomain(
      otherTenantId,
      MOCK_SHARED_TENANT_DOMAIN,
    );

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    });
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes before re-read', async () => {
    await addTenantDomain(tenantId, MOCK_SHARED_TENANT_DOMAIN);
    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await addTenantDomain(tenantId, MOCK_SHARED_TENANT_DOMAIN);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme.com'],
    ['a trailing-slash value', 'acme.com/'],
    ['a whitespace-padded value', ' acme.com '],
  ])('rejects %s without writing a row', async (_description, domain) => {
    const result = await addTenantDomain(tenantId, domain);

    const rows = await db().select().from(schema.tenantDomains);
    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN });
    expect(rows).toEqual([]);
  });

  it('removes its domain rows when the owning tenant is deleted', async () => {
    await addTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db().select().from(schema.tenantDomains);
    expect(rows).toEqual([]);
  });
});
