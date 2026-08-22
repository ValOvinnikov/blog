import { CAPABILITY } from '@blog/config';

import {
  CAPABILITY_TOGGLES,
  clampToEntitlement,
  featureDefaultsToValues,
} from './settings-features-fields';

describe('CAPABILITY_TOGGLES', () => {
  it('lists all five v1 capabilities, each mapped to its own settings_features column', () => {
    expect(CAPABILITY_TOGGLES).toEqual([
      { capability: CAPABILITY.COMMENTS, field: 'commentsEnabled' },
      { capability: CAPABILITY.RATINGS, field: 'ratingsEnabled' },
      { capability: CAPABILITY.BOOKMARKS, field: 'bookmarksEnabled' },
      { capability: CAPABILITY.NEWSLETTER, field: 'newsletterEnabled' },
      { capability: CAPABILITY.ANALYTICS, field: 'analyticsEnabled' },
    ]);
  });
});

describe(featureDefaultsToValues, () => {
  it('converts a capability-keyed defaults map into the column-keyed view model', () => {
    const defaults = {
      [CAPABILITY.COMMENTS]: true,
      [CAPABILITY.RATINGS]: true,
      [CAPABILITY.BOOKMARKS]: false,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: true,
    };

    expect(featureDefaultsToValues(defaults)).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: false,
      newsletterEnabled: false,
      analyticsEnabled: true,
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
    });
  });

  it('is a no-op when every capability is entitled', () => {
    const values = {
      commentsEnabled: true,
      ratingsEnabled: false,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
    };

    expect(
      clampToEntitlement(values, [
        CAPABILITY.COMMENTS,
        CAPABILITY.RATINGS,
        CAPABILITY.BOOKMARKS,
        CAPABILITY.NEWSLETTER,
        CAPABILITY.ANALYTICS,
      ]),
    ).toEqual(values);
  });
});
