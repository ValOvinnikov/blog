import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSettingsFeatures } from './get-settings-features';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.tenants);
});

describe(getSettingsFeatures, () => {
  it('returns undefined when the tenant has no settings_features row', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getSettingsFeatures(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns the stored toggles when a row exists', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db().insert(schema.settingsFeatures).values({
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
