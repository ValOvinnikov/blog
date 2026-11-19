import * as schema from '@shinefold/db/schema';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockSettingsFeaturesToggles } from '@shinefold/db/testing/settings-features/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getSettingsFeatures } from './get-settings-features';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
});

describe(getSettingsFeatures, () => {
  it('returns undefined when the tenant has no saved toggles', async () => {
    const result = await getSettingsFeatures(tenant().id);

    expect(result).toBeUndefined();
  });

  it('returns the stored toggles when a row exists', async () => {
    const [saved] = await db()
      .insert(schema.settingsFeatures)
      .values({ tenantId: tenant().id, ...mockSettingsFeaturesToggles() })
      .returning();

    const result = await getSettingsFeatures(tenant().id);

    expect(result).toEqual(saved);
  });
});
