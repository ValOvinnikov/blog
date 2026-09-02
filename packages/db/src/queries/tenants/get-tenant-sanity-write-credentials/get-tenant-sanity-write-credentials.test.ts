import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants/archive-tenant';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import { setTenantSanityWriteToken } from '@blog/db/queries/tenants/set-tenant-sanity-write-token';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantSanityWriteCredentials } from './get-tenant-sanity-write-credentials';

async function insertTenant(): Promise<TTenant> {
  const result = await createTenant({
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'abc123',
    sanityDataset: 'production',
    locale: 'en',
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
  });
  if (!result.ok) throw new Error('setup: createTenant failed.');
  return result.data;
}

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;
const originalKey = process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  process.env['TENANT_TOKEN_ENCRYPTION_KEY'] =
    'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';
});

afterEach(async () => {
  await db.delete(schema.tenants);
  if (originalKey === undefined) {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
  } else {
    process.env['TENANT_TOKEN_ENCRYPTION_KEY'] = originalKey;
  }
});

describe(getTenantSanityWriteCredentials, () => {
  it('resolves the decrypted token alongside project/dataset and servable state for an active tenant', async () => {
    const tenant = await insertTenant();
    await setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value');

    const credentials = await getTenantSanityWriteCredentials(tenant.id);

    expect(credentials).toEqual({
      projectId: 'abc123',
      dataset: 'production',
      token: 'sk-real-write-token-value',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });
  });

  it('still resolves working write credentials for an archived tenant, tagged with its ARCHIVED status', async () => {
    const tenant = await insertTenant();
    await setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value');
    const archived = await archiveTenant(tenant.id);
    if (!archived.ok) throw new Error('setup: archiveTenant failed.');

    const credentials = await getTenantSanityWriteCredentials(tenant.id);

    expect(credentials).toMatchObject({
      projectId: 'abc123',
      dataset: 'production',
      token: 'sk-real-write-token-value',
      status: TENANT_STATUS.ARCHIVED,
    });
  });

  it('surfaces deprovisionedAt for a deprovisioned tenant instead of collapsing to undefined', async () => {
    const tenant = await insertTenant();
    await setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value');
    await archiveTenant(tenant.id);

    const credentials = await getTenantSanityWriteCredentials(tenant.id);

    expect(credentials?.deprovisionedAt).toBeInstanceOf(Date);
  });

  it('resolves undefined for a mid-provisioning tenant with no write token set yet', async () => {
    const tenant = await insertTenant();
    await setTenantProvisioningStatus(
      tenant.id,
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );

    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for a tenant whose provisioning failed and never set a write token', async () => {
    const tenant = await insertTenant();
    await setTenantProvisioningStatus(
      tenant.id,
      TENANT_PROVISIONING_STATUS.FAILED,
    );

    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined when the tenant has no write token set yet', async () => {
    const tenant = await insertTenant();

    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined when only the read token is set, not the write token', async () => {
    const tenant = await insertTenant();
    await setTenantSanityToken(tenant.id, 'sk-real-read-token-value');

    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityWriteCredentials('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });

  it('throws when the encryption key is not configured', async () => {
    const tenant = await insertTenant();
    await setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value');
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

    await expect(getTenantSanityWriteCredentials(tenant.id)).rejects.toThrow(
      'TENANT_TOKEN_ENCRYPTION_KEY is not configured.',
    );
  });
});
