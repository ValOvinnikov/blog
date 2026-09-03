import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantSanityWriteTokenAndSeededAt } from './set-tenant-sanity-write-token-and-seeded-at';

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

describe(setTenantSanityWriteTokenAndSeededAt, () => {
  it('stores the token encrypted and the seeded-at timestamp in one call', async () => {
    const tenant = await insertTenant();
    const seededAt = new Date('2026-08-15T12:00:00.000Z');

    await setTenantSanityWriteTokenAndSeededAt(
      tenant.id,
      'sk-real-write-token-value',
      seededAt,
    );

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).not.toContain(
      'sk-real-write-token-value',
    );
    expect(row?.sanityWriteTokenEncrypted).toEqual(expect.any(String));
    expect(row?.seededAt).toEqual(seededAt);
  });

  it('throws when the encryption key is not configured, leaving both columns untouched', async () => {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
    const tenant = await insertTenant();

    await expect(
      setTenantSanityWriteTokenAndSeededAt(
        tenant.id,
        'sk-real-write-token-value',
        new Date('2026-08-15T12:00:00.000Z'),
      ),
    ).rejects.toThrow('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).toBeNull();
    expect(row?.seededAt).toBeNull();
  });
});
