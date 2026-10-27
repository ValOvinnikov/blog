import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mockSettingsFeaturesToggles } from '@blog/db/testing/settings-features/fixtures';

import { getSettingsFeatures } from './get-settings-features';

vi.mock('@blog/db/client');

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
