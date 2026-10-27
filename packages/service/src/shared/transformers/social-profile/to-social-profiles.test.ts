import { SOCIAL_PLATFORMS } from '@blog/config';
import {
  mockLinkView,
  mockRawExternalLinkDocument,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toSocialProfiles } from './to-social-profiles';

faker.seed(6104);

const MOCK_GITHUB_URL = faker.internet.url();
const MOCK_X_URL = faker.internet.url();

describe(toSocialProfiles, () => {
  it.each([null, undefined, []])('returns an empty array for %j', (raw) => {
    const result = toSocialProfiles(raw);

    expect(result).toEqual([]);
  });

  it('maps every resolvable profile', () => {
    const result = toSocialProfiles([
      mockRawSocialProfile({
        link: mockRawExternalLinkDocument({ url: MOCK_GITHUB_URL }),
      }),
      mockRawSocialProfile({
        platform: SOCIAL_PLATFORMS.X,
        link: mockRawExternalLinkDocument({ url: MOCK_X_URL }),
      }),
    ]);

    expect(result).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: mockLinkView({ href: MOCK_GITHUB_URL }),
      },
      {
        platform: SOCIAL_PLATFORMS.X,
        link: mockLinkView({ href: MOCK_X_URL }),
      },
    ]);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const result = toSocialProfiles([
      mockRawSocialProfile({
        link: mockRawExternalLinkDocument({ url: null }),
      }),
      mockRawSocialProfile({
        platform: SOCIAL_PLATFORMS.X,
        link: mockRawExternalLinkDocument({ url: MOCK_X_URL }),
      }),
    ]);

    expect(result).toEqual([
      {
        platform: SOCIAL_PLATFORMS.X,
        link: mockLinkView({ href: MOCK_X_URL }),
      },
    ]);
  });
});
