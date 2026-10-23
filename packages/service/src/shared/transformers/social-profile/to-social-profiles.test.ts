import { SOCIAL_PLATFORMS } from '@blog/config';
import {
  mockRawExternalLinkDocument,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toSocialProfiles } from './to-social-profiles';

const X_URL = 'https://x.com/janedoe';

describe(toSocialProfiles, () => {
  it.each([null, undefined, []])('returns an empty array for %j', (raw) => {
    const result = toSocialProfiles(raw);

    expect(result).toEqual([]);
  });

  it('maps every resolvable profile', () => {
    const githubProfile = mockRawSocialProfile();
    const raw = [
      githubProfile,
      mockRawSocialProfile({
        platform: SOCIAL_PLATFORMS.X,
        link: mockRawExternalLinkDocument({ url: X_URL }),
      }),
    ];

    const result = toSocialProfiles(raw);

    expect(result.map(({ platform, link }) => [platform, link.href])).toEqual([
      [SOCIAL_PLATFORMS.GITHUB, githubProfile.link.url],
      [SOCIAL_PLATFORMS.X, X_URL],
    ]);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const raw = [
      mockRawSocialProfile({
        link: mockRawExternalLinkDocument({ url: null }),
      }),
      mockRawSocialProfile({ platform: SOCIAL_PLATFORMS.X }),
    ];

    const result = toSocialProfiles(raw);

    expect(result.map(({ platform }) => platform)).toEqual([
      SOCIAL_PLATFORMS.X,
    ]);
  });
});
