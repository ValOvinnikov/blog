import { CAPABILITY } from '@blog/config';
import {
  mockAllOnSettingsFeaturesValues,
  mockSettingsFeaturesValues,
} from '@platform/testing/settings-features/fixtures';

import {
  clampToEntitlement,
  featureDefaultsToValues,
  keepStoredOutOfPlan,
  listSwitchedOnOutOfPlan,
  type TSettingsFeaturesValues,
  withComingSoonOff,
} from './settings-features-fields';

const ALL_OFF = mockSettingsFeaturesValues();

const ALL_ON = mockAllOnSettingsFeaturesValues();

describe(featureDefaultsToValues, () => {
  it('converts a capability-keyed defaults map into the column-keyed view model', () => {
    const defaults = {
      [CAPABILITY.READER_ACCOUNTS]: true,
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
      readerAccountsEnabled: true,
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

describe(listSwitchedOnOutOfPlan, () => {
  const FREE_CAPABILITIES = [CAPABILITY.CONSENT_BANNER];

  it('lists an out-of-plan toggle switched on that is stored off', () => {
    const values = { ...ALL_OFF, analyticsEnabled: true };

    expect(listSwitchedOnOutOfPlan(values, ALL_OFF, FREE_CAPABILITIES)).toEqual(
      ['analyticsEnabled'],
    );
  });

  it('passes an out-of-plan toggle still on as stored', () => {
    const stored = { ...ALL_OFF, analyticsEnabled: true };

    expect(listSwitchedOnOutOfPlan(stored, stored, FREE_CAPABILITIES)).toEqual(
      [],
    );
  });

  it('passes an in-plan toggle switched on', () => {
    const values = { ...ALL_OFF, consentBannerEnabled: true };

    expect(listSwitchedOnOutOfPlan(values, ALL_OFF, FREE_CAPABILITIES)).toEqual(
      [],
    );
  });
});

describe(withComingSoonOff, () => {
  it('turns every coming-soon capability off, leaving the rest as given', () => {
    const values = withComingSoonOff(ALL_ON);

    expect(values).toEqual({
      ...ALL_ON,
      commentsEnabled: false,
      ratingsEnabled: false,
      newsletterEnabled: false,
    });
  });

  it('leaves values with no coming-soon capability on unchanged', () => {
    const values = { ...ALL_OFF, bookmarksEnabled: true };

    expect(withComingSoonOff(values)).toEqual(values);
  });
});
