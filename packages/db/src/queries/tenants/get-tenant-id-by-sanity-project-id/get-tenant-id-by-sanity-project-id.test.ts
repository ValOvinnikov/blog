import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantIdBySanityProjectId } from './get-tenant-id-by-sanity-project-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(
  slug: string,
  sanityProjectId: string | null,
  createdAt?: Date,
): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId,
      sanityDataset: sanityProjectId ? 'production' : null,
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      ...(createdAt ? { createdAt } : {}),
    })
    .returning();
  return tenant!.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(getTenantIdBySanityProjectId, () => {
  it('returns the tenant id for a matching sanityProjectId', async () => {
    const tenantId = await insertTenant('acme', 'abc123');

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBe(tenantId);
  });

  it('returns undefined when no tenant matches', async () => {
    await insertTenant('acme', 'abc123');

    const result = await getTenantIdBySanityProjectId('missing');

    expect(result).toBeUndefined();
  });

  it('returns undefined when sanityProjectId is null on every row', async () => {
    await insertTenant('acme', null);

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBeUndefined();
  });

  it('deterministically resolves to the earliest-created match when more than one tenant shares a sanityProjectId', async () => {
    const olderTenantId = await insertTenant(
      'acme',
      'abc123',
      new Date('2026-01-01'),
    );
    await insertTenant('acme-duplicate', 'abc123', new Date('2026-02-01'));

    const result = await getTenantIdBySanityProjectId('abc123');

    expect(result).toBe(olderTenantId);
  });
});
