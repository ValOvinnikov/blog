import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';

import { siteSettingsQuery } from './query';

describe('siteSettingsQuery', () => {
  it('parses site settings with no tagline authored', () => {
    const raw = makeRawSiteSettings({ tagline: null });

    expect(() => siteSettingsQuery.parse(raw)).not.toThrow();
    expect(siteSettingsQuery.parse(raw)?.tagline).toBeNull();
  });
});
