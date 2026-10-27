import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { upsertSettingsFeatures } from './upsert-settings-features';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.tenants);
});

describe(upsertSettingsFeatures, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a row with column defaults for omitted toggles', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const [defaults] = await db()
      .insert(schema.settingsFeatures)
      .values({ tenantId: otherTenantId })
      .returning();

    const result = await upsertSettingsFeatures(tenantId, {
      newsletterEnabled: true,
    });

    expect(result).toEqual({
      ...defaults,
      id: result.id,
      tenantId,
      newsletterEnabled: true,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  });

  it('updates the existing row in place', async () => {
    await upsertSettingsFeatures(tenantId, {});

    const result = await upsertSettingsFeatures(tenantId, {
      commentsEnabled: false,
    });

    const rows = await db().select().from(schema.settingsFeatures);
    expect(rows).toEqual([result]);
    expect(result.commentsEnabled).toBe(false);
  });

  it('leaves an omitted toggle untouched on a later update', async () => {
    await upsertSettingsFeatures(tenantId, { newsletterEnabled: true });

    const result = await upsertSettingsFeatures(tenantId, {
      commentsEnabled: false,
    });

    expect(result.newsletterEnabled).toBe(true);
    expect(result.commentsEnabled).toBe(false);
  });

  it('rejects a tenant that does not exist', async () => {
    const upsert = upsertSettingsFeatures(MOCK_MISSING_TENANT_ID, {
      commentsEnabled: false,
    });

    await expect(upsert).rejects.toThrow();
  });
});
