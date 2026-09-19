import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { upsertSettingsFeatures } from './upsert-settings-features';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.tenants);
});

describe(upsertSettingsFeatures, () => {
  it('inserts a new row falling back to column defaults for omitted toggles', async () => {
    const { id: tenantId } = await insertTestTenant(db());

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
    const { id: tenantId } = await insertTestTenant(db());
    await upsertSettingsFeatures(tenantId, {});

    const result = await upsertSettingsFeatures(tenantId, {
      commentsEnabled: false,
    });

    expect(result.commentsEnabled).toBe(false);
    const rows = await db().select().from(schema.settingsFeatures);
    expect(rows).toHaveLength(1);
  });

  it('leaves an omitted toggle untouched on a later update', async () => {
    const { id: tenantId } = await insertTestTenant(db());
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
