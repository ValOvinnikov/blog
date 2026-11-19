import { PRESET_ID } from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockSettingsFeaturesToggles } from '@shinefold/db/testing/settings-features/fixtures';
import { insertTestSiteConfig } from '@shinefold/db/testing/site-config/fixtures';

import { getSettingsFeaturesAndPreset } from './get-settings-features-and-preset';

vi.mock('@shinefold/db/client');

const NOTHING_SAVED = {
  features: undefined,
  updatedAt: undefined,
  preset: undefined,
};

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.siteConfig);
  await db().delete(schema.tenants);
});

describe(getSettingsFeaturesAndPreset, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns neither features nor preset when nothing is saved', async () => {
    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual(NOTHING_SAVED);
  });

  it('returns the preset alone when only site config exists', async () => {
    await insertTestSiteConfig(db(), tenantId, { preset: PRESET_ID.EDITORIAL });

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual({ ...NOTHING_SAVED, preset: PRESET_ID.EDITORIAL });
  });

  it('returns the saved toggles when only features exist', async () => {
    const toggles = mockSettingsFeaturesToggles();
    const [saved] = await db()
      .insert(schema.settingsFeatures)
      .values({ tenantId, ...toggles })
      .returning();

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual({
      ...NOTHING_SAVED,
      features: toggles,
      updatedAt: saved?.updatedAt,
    });
  });

  it("ignores another tenant's rows", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.settingsFeatures).values({
      tenantId: otherTenantId,
    });

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual(NOTHING_SAVED);
  });
});
