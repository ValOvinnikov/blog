import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getSettingsFeatures } from './get-settings-features';

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
  await db.delete(schema.settingsFeatures);
  await db.delete(schema.tenants);
});

describe(getSettingsFeatures, () => {
  it('returns undefined when the tenant has no settings_features row', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    const result = await getSettingsFeatures(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns the stored toggles when a row exists', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db.insert(schema.settingsFeatures).values({
      tenantId,
      newsletterEnabled: true,
      analyticsEnabled: true,
    });

    const result = await getSettingsFeatures(tenantId);

    expect(result).toMatchObject({
      tenantId,
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: true,
    });
  });
});
