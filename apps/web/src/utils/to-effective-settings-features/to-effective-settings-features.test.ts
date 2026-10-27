import { CAPABILITY, PRESET_ID, PRESET_REGISTRY } from '@blog/config';

import { toEffectiveSettingsFeatures } from './to-effective-settings-features';

describe(toEffectiveSettingsFeatures, () => {
  it('falls back to the preset defaults when there is no row', () => {
    const result = toEffectiveSettingsFeatures(undefined, PRESET_ID.EDITORIAL);

    expect(result).toEqual(
      PRESET_REGISTRY[PRESET_ID.EDITORIAL].featureDefaults,
    );
  });

  it('maps each column to its capability when a row exists', () => {
    const result = toEffectiveSettingsFeatures(
      {
        commentsEnabled: false,
        ratingsEnabled: true,
        bookmarksEnabled: false,
        newsletterEnabled: true,
        analyticsEnabled: true,
        consentBannerEnabled: false,
        contactFormEnabled: false,
      },
      PRESET_ID.CONSOLE,
    );

    expect(result).toEqual({
      [CAPABILITY.COMMENTS]: false,
      [CAPABILITY.RATINGS]: true,
      [CAPABILITY.BOOKMARKS]: false,
      [CAPABILITY.NEWSLETTER]: true,
      [CAPABILITY.ANALYTICS]: true,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: false,
    });
  });

  it('lets an existing row win whole over the preset defaults', () => {
    const result = toEffectiveSettingsFeatures(
      {
        commentsEnabled: false,
        ratingsEnabled: false,
        bookmarksEnabled: false,
        newsletterEnabled: false,
        analyticsEnabled: false,
        consentBannerEnabled: false,
        contactFormEnabled: false,
      },
      PRESET_ID.EDITORIAL,
    );

    expect(result[CAPABILITY.COMMENTS]).toBe(false);
  });
});
