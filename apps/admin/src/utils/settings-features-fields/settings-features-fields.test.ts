import { CAPABILITY } from '@blog/config';

import {
  CAPABILITY_TOGGLES,
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
