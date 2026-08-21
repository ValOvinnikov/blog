import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { upsertSettingsFeatures } from './upsert-settings-features';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
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
  await db.delete(schema.settingsFeatures);
  await db.delete(schema.tenants);
});

describe(upsertSettingsFeatures, () => {
  it('inserts a new row falling back to column defaults for omitted toggles', async () => {
    const tenantId = await insertTenant('acme');

    const result = await upsertSettingsFeatures(tenantId, {
      newsletterEnabled: true,
    });

    expect(result).toMatchObject({
      tenantId,
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
    });
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    const tenantId = await insertTenant('acme');
    await upsertSettingsFeatures(tenantId, {});

    const result = await upsertSettingsFeatures(tenantId, {
      commentsEnabled: false,
    });

    expect(result.commentsEnabled).toBe(false);
    const rows = await db.select().from(schema.settingsFeatures);
    expect(rows).toHaveLength(1);
  });

  it('leaves an omitted toggle untouched on a later update', async () => {
    const tenantId = await insertTenant('acme');
    await upsertSettingsFeatures(tenantId, { newsletterEnabled: true });

    const result = await upsertSettingsFeatures(tenantId, {
      commentsEnabled: false,
    });

    expect(result.newsletterEnabled).toBe(true);
    expect(result.commentsEnabled).toBe(false);
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertSettingsFeatures('00000000-0000-0000-0000-000000000000', {
        commentsEnabled: false,
      }),
    ).rejects.toThrow();
  });
});
