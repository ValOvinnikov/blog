import { SOCIAL_PLATFORMS } from '@blog/config';
import {
  makeRawExternalLinkDocument,
  makeRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toSocialProfiles } from './to-social-profiles';

describe(toSocialProfiles, () => {
  it('returns an empty array for a null/undefined raw list', () => {
    expect(toSocialProfiles(null)).toEqual([]);
    expect(toSocialProfiles(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty raw list', () => {
    expect(toSocialProfiles([])).toEqual([]);
  });

  it('maps every resolvable profile', () => {
    const raw = [
      makeRawSocialProfile({ platform: SOCIAL_PLATFORMS.GITHUB }),
      makeRawSocialProfile({
        platform: SOCIAL_PLATFORMS.X,
        link: makeRawExternalLinkDocument({ url: 'https://x.com/janedoe' }),
      }),
    ];

    expect(toSocialProfiles(raw)).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: expect.objectContaining({ href: 'https://github.com/janedoe' }),
      },
      {
        platform: SOCIAL_PLATFORMS.X,
        link: expect.objectContaining({ href: 'https://x.com/janedoe' }),
      },
    ]);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const raw = [
      makeRawSocialProfile({
        link: makeRawExternalLinkDocument({ url: null }),
      }),
      makeRawSocialProfile({ platform: SOCIAL_PLATFORMS.X }),
    ];

    const result = toSocialProfiles(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.platform).toBe(SOCIAL_PLATFORMS.X);
  });
});
