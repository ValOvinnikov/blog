import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';

import { siteSettingsQuery } from './query';

describe('siteSettingsQuery', () => {
  it('parses site settings with no default OG image uploaded', () => {
    const raw = makeRawSiteSettings({ defaultOgImage: null });

    expect(() => siteSettingsQuery.parse(raw)).not.toThrow();
    expect(siteSettingsQuery.parse(raw)?.defaultOgImage).toBeNull();
  });
});
