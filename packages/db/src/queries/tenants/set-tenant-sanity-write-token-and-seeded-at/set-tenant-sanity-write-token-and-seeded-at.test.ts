import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import { eq } from 'drizzle-orm';

import { setTenantSanityWriteTokenAndSeededAt } from './set-tenant-sanity-write-token-and-seeded-at';

async function insertTenant(): Promise<TTenant> {
  const result = await createTenant({
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'abc123',
    sanityDataset: 'production',
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
  });
  if (!result.ok) throw new Error('setup: createTenant failed.');
  return result.data;
}

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const WRITE_TOKEN = 'sk-real-write-token-value';
const SEEDED_AT = new Date('2026-08-15T12:00:00.000Z');

const db = useQueryTestDb(getDbMock);
useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityWriteTokenAndSeededAt, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTenant();
  });

  it('stores the token encrypted and the seeded-at timestamp in one call', async () => {
    await setTenantSanityWriteTokenAndSeededAt(
      tenant.id,
      WRITE_TOKEN,
      SEEDED_AT,
    );

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).not.toContain(WRITE_TOKEN);
    expect(row?.sanityWriteTokenEncrypted).toEqual(expect.any(String));
    expect(row?.seededAt).toEqual(SEEDED_AT);
  });

  it('throws when the encryption key is not configured, leaving both columns untouched', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantSanityWriteTokenAndSeededAt(tenant.id, WRITE_TOKEN, SEEDED_AT),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).toBeNull();
    expect(row?.seededAt).toBeNull();
  });
});
