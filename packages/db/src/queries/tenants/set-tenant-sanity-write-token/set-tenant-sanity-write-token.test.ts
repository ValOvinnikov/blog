import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantSanityWriteToken } from './set-tenant-sanity-write-token';

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

const db = useQueryTestDb(getDbMock);
const originalKey = process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

beforeEach(() => {
  process.env['TENANT_TOKEN_ENCRYPTION_KEY'] =
    'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';
});

afterEach(async () => {
  await db().delete(schema.tenants);
  if (originalKey === undefined) {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
  } else {
    process.env['TENANT_TOKEN_ENCRYPTION_KEY'] = originalKey;
  }
});

describe(setTenantSanityWriteToken, () => {
  it('stores the token encrypted, not as plaintext', async () => {
    const tenant = await insertTenant();

    await setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value');

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).not.toContain(
      'sk-real-write-token-value',
    );
    expect(row?.sanityWriteTokenEncrypted).toEqual(expect.any(String));
  });

  it('throws when the encryption key is not configured', async () => {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
    const tenant = await insertTenant();

    await expect(
      setTenantSanityWriteToken(tenant.id, 'sk-real-write-token-value'),
    ).rejects.toThrow('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  });
});
