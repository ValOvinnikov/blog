import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_DOMAIN,
} from '@blog/db/testing/tenants/fixtures';

import { setTenantPrimaryDomain } from './set-tenant-primary-domain';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(setTenantPrimaryDomain, () => {
  let tenantId: string;
  let otherTenantId: string;

  async function readPrimaryDomain(id: string) {
    const rows = await db().select().from(schema.tenants);
    return rows.find((row) => row.id === id)?.primaryDomain;
  }

  async function readDomainRows() {
    const rows = await db().select().from(schema.tenantDomains);
    return rows.map(({ tenantId: id, domain }) => `${id}:${domain}`).sort();
  }

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
    ({ id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    }));
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: MOCK_TENANT_DOMAIN },
        { tenantId, domain: MOCK_WWW_TENANT_DOMAIN },
        { tenantId: otherTenantId, domain: MOCK_OTHER_TENANT_DOMAIN },
      ]);
  });

  it('switches to the custom domain and back without touching rows', async () => {
    const rowsBefore = await readDomainRows();

    const toCustom = await setTenantPrimaryDomain(
      tenantId,
      MOCK_WWW_TENANT_DOMAIN,
    );
    const afterCustom = await readPrimaryDomain(tenantId);
    const rowsAfterCustom = await readDomainRows();
    const toSubdomain = await setTenantPrimaryDomain(
      tenantId,
      MOCK_TENANT_DOMAIN,
    );

    expect(toCustom).toMatchObject({
      ok: true,
      data: { id: tenantId, primaryDomain: MOCK_WWW_TENANT_DOMAIN },
    });
    expect(afterCustom).toBe(MOCK_WWW_TENANT_DOMAIN);
    expect(rowsAfterCustom).toEqual(rowsBefore);
    expect(toSubdomain).toMatchObject({
      ok: true,
      data: { primaryDomain: MOCK_TENANT_DOMAIN },
    });
    expect(await readPrimaryDomain(tenantId)).toBe(MOCK_TENANT_DOMAIN);
    expect(await readDomainRows()).toEqual(rowsBefore);
  });

  it('returns ok when the domain is already the primary', async () => {
    const result = await setTenantPrimaryDomain(tenantId, MOCK_TENANT_DOMAIN);

    expect(result).toMatchObject({
      ok: true,
      data: { primaryDomain: MOCK_TENANT_DOMAIN },
    });
  });

  it('refuses a domain that belongs to another tenant', async () => {
    const result = await setTenantPrimaryDomain(
      tenantId,
      MOCK_OTHER_TENANT_DOMAIN,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    expect(await readPrimaryDomain(tenantId)).toBe(MOCK_TENANT_DOMAIN);
  });

  it('refuses a domain with no tenant_domains row', async () => {
    const result = await setTenantPrimaryDomain(
      tenantId,
      MOCK_MISSING_TENANT_DOMAIN,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    expect(await readPrimaryDomain(tenantId)).toBe(MOCK_TENANT_DOMAIN);
  });

  it('refuses an unknown tenant', async () => {
    const result = await setTenantPrimaryDomain(
      MOCK_MISSING_TENANT_ID,
      MOCK_WWW_TENANT_DOMAIN,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    expect(await readPrimaryDomain(tenantId)).toBe(MOCK_TENANT_DOMAIN);
  });
});
