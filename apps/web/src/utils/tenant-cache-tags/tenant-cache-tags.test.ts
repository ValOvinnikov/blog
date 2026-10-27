import { faker } from '@faker-js/faker';

import {
  buildSettingsFeaturesCacheTag,
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from './tenant-cache-tags';

faker.seed(6012);

const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_OTHER_TENANT_ID = faker.string.uuid();

const TAG_BUILDERS = [
  { builder: buildSiteConfigCacheTag },
  { builder: buildSettingsFeaturesCacheTag },
  { builder: buildTenantPlanCacheTag },
];

describe('tenant cache tags', () => {
  it.each(TAG_BUILDERS)(
    '$builder.name scopes the tag to the given tenant id',
    ({ builder }) => {
      expect(builder(MOCK_TENANT_ID)).toContain(MOCK_TENANT_ID);
    },
  );

  it.each(TAG_BUILDERS)(
    '$builder.name produces a different tag for a different tenant',
    ({ builder }) => {
      expect(builder(MOCK_TENANT_ID)).not.toBe(builder(MOCK_OTHER_TENANT_ID));
    },
  );

  it('gives each kind of cached data its own tag for the same tenant', () => {
    const tags = TAG_BUILDERS.map(({ builder }) => builder(MOCK_TENANT_ID));

    expect(new Set(tags).size).toBe(TAG_BUILDERS.length);
  });
});
