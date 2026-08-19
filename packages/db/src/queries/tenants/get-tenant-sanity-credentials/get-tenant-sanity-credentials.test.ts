import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

async function insertTenant(): Promise<TTenant> {
  const result = await createTenant({
    slug: 'acme',
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

describe(getTenantSanityCredentials, () => {
  it('resolves the decrypted token alongside project/dataset', async () => {
    const tenant = await insertTenant();
    await setTenantSanityToken(tenant.id, 'sk-real-token-value');

    const credentials = await getTenantSanityCredentials(tenant.id);

    expect(credentials).toEqual({
      projectId: 'abc123',
      dataset: 'production',
      token: 'sk-real-token-value',
    });
  });

  it('resolves undefined when the tenant has no token set yet', async () => {
    const tenant = await insertTenant();

    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityCredentials('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });

  it('throws when the encryption key is not configured', async () => {
    const tenant = await insertTenant();
    await setTenantSanityToken(tenant.id, 'sk-real-token-value');
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

    await expect(getTenantSanityCredentials(tenant.id)).rejects.toThrow(
      'TENANT_TOKEN_ENCRYPTION_KEY is not configured.',
    );
  });
});
