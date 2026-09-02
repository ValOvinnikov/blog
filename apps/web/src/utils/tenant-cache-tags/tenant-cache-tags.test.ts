import {
  buildSettingsFeaturesCacheTag,
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from './tenant-cache-tags';

describe(buildSiteConfigCacheTag, () => {
  it('scopes the tag to the given tenant id', () => {
    expect(buildSiteConfigCacheTag('tenant-1')).toBe('site-config:tenant-1');
  });

  it('produces a different tag for a different tenant', () => {
    expect(buildSiteConfigCacheTag('tenant-1')).not.toBe(
      buildSiteConfigCacheTag('tenant-2'),
    );
  });
});

describe(buildSettingsFeaturesCacheTag, () => {
  it('scopes the tag to the given tenant id', () => {
    expect(buildSettingsFeaturesCacheTag('tenant-1')).toBe(
      'settings-features:tenant-1',
    );
  });
});

describe(buildTenantPlanCacheTag, () => {
  it('scopes the tag to the given tenant id', () => {
    expect(buildTenantPlanCacheTag('tenant-1')).toBe('tenant-plan:tenant-1');
  });
});
