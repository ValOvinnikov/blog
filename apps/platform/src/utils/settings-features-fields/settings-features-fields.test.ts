import { CAPABILITY } from '@blog/config';

import {
  clampToEntitlement,
  featureDefaultsToValues,
} from './settings-features-fields';

describe(featureDefaultsToValues, () => {
  it('converts a capability-keyed defaults map into the column-keyed view model', () => {
    const defaults = {
      [CAPABILITY.COMMENTS]: true,
      [CAPABILITY.RATINGS]: true,
      [CAPABILITY.BOOKMARKS]: false,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: true,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: true,
    };

    expect(featureDefaultsToValues(defaults)).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: false,
      newsletterEnabled: false,
      analyticsEnabled: true,
      consentBannerEnabled: false,
      contactFormEnabled: true,
    });
  });
});

describe(clampToEntitlement, () => {
  it('forces every out-of-plan capability to false, leaving entitled ones untouched', () => {
    const values = {
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: true,
      consentBannerEnabled: true,
      contactFormEnabled: true,
    };

    expect(
      clampToEntitlement(values, [
        CAPABILITY.COMMENTS,
        CAPABILITY.RATINGS,
        CAPABILITY.BOOKMARKS,
      ]),
    ).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
      consentBannerEnabled: false,
      contactFormEnabled: false,
    });
  });

  it('is a no-op when every capability is entitled', () => {
    const values = {
      commentsEnabled: true,
      ratingsEnabled: false,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
      consentBannerEnabled: true,
      contactFormEnabled: true,
    };

    expect(
      clampToEntitlement(values, [
        CAPABILITY.COMMENTS,
        CAPABILITY.RATINGS,
        CAPABILITY.BOOKMARKS,
        CAPABILITY.NEWSLETTER,
        CAPABILITY.ANALYTICS,
        CAPABILITY.CONSENT_BANNER,
        CAPABILITY.CONTACT_FORM,
      ]),
    ).toEqual(values);
  });
});
