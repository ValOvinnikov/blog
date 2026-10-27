import type * as schema from '@blog/db/schema';

export function mockSettingsFeaturesToggles(
  overrides: Partial<typeof schema.settingsFeatures.$inferInsert> = {},
) {
  return {
    commentsEnabled: false,
    ratingsEnabled: false,
    bookmarksEnabled: false,
    newsletterEnabled: true,
    analyticsEnabled: true,
    consentBannerEnabled: true,
    contactFormEnabled: false,
    ...overrides,
  };
}
