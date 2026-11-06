import { CAPABILITY } from '@blog/config';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';

import {
  clampToEntitlement,
  featureDefaultsToValues,
  blockSwitchOnWhileParentOff,
  keepStoredOutOfPlan,
  listSwitchedOnOutOfPlan,
  type TSettingsFeaturesValues,
  withComingSoonOff,
  withParentOffApplied,
} from './settings-features-fields';

const ALL_OFF = mockSettingsFeaturesValues();

const ALL_ON: TSettingsFeaturesValues = {
  readerAccountsEnabled: true,
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

describe(blockSwitchOnWhileParentOff, () => {
  it('keeps a sub-item stored on while its parent is off', () => {
    const values = { ...ALL_OFF, bookmarksEnabled: true };

    expect(blockSwitchOnWhileParentOff(values, values)).toEqual(values);
  });

  it('refuses to switch a sub-item on while its parent is off', () => {
    const submitted = { ...ALL_OFF, bookmarksEnabled: true };

    expect(blockSwitchOnWhileParentOff(submitted, ALL_OFF)).toEqual(ALL_OFF);
  });

  it('lets a sub-item be switched off while its parent is off', () => {
    const stored = { ...ALL_OFF, bookmarksEnabled: true };

    expect(blockSwitchOnWhileParentOff(ALL_OFF, stored)).toEqual(ALL_OFF);
  });

  it('takes a sub-item as submitted while its parent is on', () => {
    const submitted = {
      ...ALL_OFF,
      readerAccountsEnabled: true,
      bookmarksEnabled: true,
    };

    expect(blockSwitchOnWhileParentOff(submitted, ALL_OFF)).toEqual(submitted);
  });
});

describe(withParentOffApplied, () => {
  it('turns every sub-item off while its parent is off', () => {
    expect(
      withParentOffApplied({ ...ALL_ON, readerAccountsEnabled: false }),
    ).toEqual({
      ...ALL_ON,
      readerAccountsEnabled: false,
      bookmarksEnabled: false,
      commentsEnabled: false,
      ratingsEnabled: false,
    });
  });

  it('leaves sub-items as given while their parent is on', () => {
    expect(withParentOffApplied(ALL_ON)).toEqual(ALL_ON);
  });
});
