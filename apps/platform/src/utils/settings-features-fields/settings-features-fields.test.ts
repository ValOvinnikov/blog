import { CAPABILITY } from '@blog/config';

import {
  clampToEntitlement,
  featureDefaultsToValues,
  keepStoredOutOfPlan,
  type TSettingsFeaturesValues,
} from './settings-features-fields';

const ALL_OFF: TSettingsFeaturesValues = {
  commentsEnabled: false,
  ratingsEnabled: false,
  bookmarksEnabled: false,
  newsletterEnabled: false,
  analyticsEnabled: false,
  consentBannerEnabled: false,
  contactFormEnabled: false,
};

const ALL_ON: TSettingsFeaturesValues = {
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: true,
  analyticsEnabled: true,
  consentBannerEnabled: true,
  contactFormEnabled: true,
};

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
      ...ALL_OFF,
      commentsEnabled: true,
      ratingsEnabled: true,
      analyticsEnabled: true,
      contactFormEnabled: true,
    });
  });
});

describe(clampToEntitlement, () => {
  it('forces every out-of-plan capability to false, leaving entitled ones', () => {
    const clamped = clampToEntitlement(ALL_ON, [
      CAPABILITY.COMMENTS,
      CAPABILITY.RATINGS,
      CAPABILITY.BOOKMARKS,
    ]);

    expect(clamped).toEqual({
      ...ALL_OFF,
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
    });
  });

  it('is a no-op when every capability is entitled', () => {
    const values = {
      ...ALL_ON,
      ratingsEnabled: false,
      analyticsEnabled: false,
    };

    const clamped = clampToEntitlement(values, Object.values(CAPABILITY));

    expect(clamped).toEqual(values);
  });
});

describe(keepStoredOutOfPlan, () => {
  it('takes out-of-plan toggles from the stored values, entitled ones as submitted', () => {
    const submitted: TSettingsFeaturesValues = {
      ...ALL_OFF,
      commentsEnabled: true,
      consentBannerEnabled: true,
    };
    const stored: TSettingsFeaturesValues = {
      ...ALL_OFF,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      analyticsEnabled: true,
      contactFormEnabled: true,
    };

    const kept = keepStoredOutOfPlan(submitted, stored, [
      CAPABILITY.COMMENTS,
      CAPABILITY.RATINGS,
      CAPABILITY.CONSENT_BANNER,
    ]);

    expect(kept).toEqual({
      ...ALL_OFF,
      commentsEnabled: true,
      bookmarksEnabled: true,
      analyticsEnabled: true,
      consentBannerEnabled: true,
      contactFormEnabled: true,
    });
  });
});
