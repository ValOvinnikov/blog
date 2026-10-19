import { CAPABILITY } from '@blog/config';

import {
  clampToEntitlement,
  featureDefaultsToValues,
  keepStoredOutOfPlan,
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

describe(keepStoredOutOfPlan, () => {
  it('takes every out-of-plan toggle from the stored values, leaving entitled ones as submitted', () => {
    const submitted = {
      commentsEnabled: true,
      ratingsEnabled: false,
      bookmarksEnabled: false,
      newsletterEnabled: false,
      analyticsEnabled: false,
      consentBannerEnabled: true,
      contactFormEnabled: false,
    };
    const stored = {
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: true,
      consentBannerEnabled: false,
      contactFormEnabled: true,
    };

    expect(
      keepStoredOutOfPlan(submitted, stored, [
        CAPABILITY.COMMENTS,
        CAPABILITY.RATINGS,
        CAPABILITY.CONSENT_BANNER,
      ]),
    ).toEqual({
      commentsEnabled: true,
      ratingsEnabled: false,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: true,
      consentBannerEnabled: true,
      contactFormEnabled: true,
    });
  });
});
