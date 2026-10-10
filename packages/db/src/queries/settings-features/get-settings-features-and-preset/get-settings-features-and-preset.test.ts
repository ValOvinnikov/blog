import { PRESET_ID } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSettingsFeaturesAndPreset } from './get-settings-features-and-preset';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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

  it('returns neither features nor preset when the tenant has saved neither', async () => {
    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual({ features: undefined, preset: undefined });
  });

  it('returns the preset alone when only site_config exists', async () => {
    await db().insert(schema.siteConfig).values({
      tenantId,
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
    });

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual({
      features: undefined,
      preset: PRESET_ID.EDITORIAL,
    });
  });

  it('returns the saved toggles when only settings_features exists', async () => {
    await db().insert(schema.settingsFeatures).values({
      tenantId,
      commentsEnabled: false,
      newsletterEnabled: true,
    });

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result).toEqual({
      features: {
        commentsEnabled: false,
        ratingsEnabled: true,
        bookmarksEnabled: true,
        newsletterEnabled: true,
        analyticsEnabled: false,
        consentBannerEnabled: false,
      },
      preset: undefined,
    });
  });

  it("ignores another tenant's rows", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.settingsFeatures).values({
      tenantId: otherTenantId,
    });

    const result = await getSettingsFeaturesAndPreset(tenantId);

    expect(result.features).toBeUndefined();
  });
});
