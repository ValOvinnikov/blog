import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockSettingsFeaturesToggles } from '@shinefold/db/testing/settings-features/fixtures';

import { getSettingsFeatures } from './get-settings-features';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.tenants);
});

describe(getSettingsFeatures, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns undefined when the tenant has no saved toggles', async () => {
    const result = await getSettingsFeatures(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns the stored toggles when a row exists', async () => {
    const [saved] = await db()
      .insert(schema.settingsFeatures)
      .values({ tenantId, ...mockSettingsFeaturesToggles() })
      .returning();

    const result = await getSettingsFeatures(tenantId);

    expect(result).toEqual(saved);
  });
});
