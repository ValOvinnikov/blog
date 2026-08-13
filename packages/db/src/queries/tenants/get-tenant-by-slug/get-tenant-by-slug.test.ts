import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantBySlug } from './get-tenant-by-slug';

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
  await db.delete(schema.tenants);
});

describe(getTenantBySlug, () => {
  it('returns the row for an existing slug', async () => {
    await db.insert(schema.tenants).values({
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });

    const result = await getTenantBySlug('acme');

    expect(result).toMatchObject({ slug: 'acme' });
  });

  it('returns undefined for a slug with no row', async () => {
    const result = await getTenantBySlug('missing');

    expect(result).toBeUndefined();
  });
});
