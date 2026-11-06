import {
  mockAllOnSettingsFeaturesValues,
  mockSettingsFeaturesValues,
} from '@platform/testing/settings-features/fixtures';

import {
  blockSwitchOnWhileParentOff,
  withParentOffApplied,
} from './parent-toggle';

const ALL_OFF = mockSettingsFeaturesValues();

const ALL_ON = mockAllOnSettingsFeaturesValues();

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
