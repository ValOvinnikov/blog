import { SOCIAL_PLATFORMS } from '@blog/config';
import {
  makeRawExternalLinkDocument,
  makeRawPersonBioBlock,
  makeRawSanityImage,
  makeRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toPersonProfile, type TRawPersonProfile } from './to-person-profile';

function makeRaw(
  overrides: Partial<TRawPersonProfile> = {},
): TRawPersonProfile {
  return {
    _id: 'person-1',
    name: 'Jamie Rivera',
    image: null,
    profilePage: null,
    role: null,
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

describe(toPersonProfile, () => {
  it('maps everything absent', () => {
    const result = toPersonProfile(makeRaw());

    expect(result.image).toBeUndefined();
    expect(result.role).toBeUndefined();
    expect(result.bio).toBeUndefined();
    expect(result.socialLinks).toEqual([]);
    expect(result.profileUrl).toBeUndefined();
  });

  it('maps everything populated', () => {
    const result = toPersonProfile(
      makeRaw({
        image: makeRawSanityImage('Jamie headshot'),
        role: 'Staff Engineer',
        bio: [makeRawPersonBioBlock({ text: 'Builds things.' })],
        socialLinks: [
          makeRawSocialProfile({
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: makeRawExternalLinkDocument({
              url: 'https://github.com/jamie',
            }),
          }),
        ],
        profilePage: makeRawExternalLinkDocument({
          url: 'https://example.com/team/jamie',
        }),
      }),
    );

    expect(result.id).toBe('person-1');
    expect(result.name).toBe('Jamie Rivera');
    expect(result.image).toMatchObject({ alt: 'Jamie headshot' });
    expect(result.role).toBe('Staff Engineer');
    expect(result.bio?.[0]).toMatchObject({
      children: [{ text: 'Builds things.' }],
    });
    expect(result.socialLinks).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: expect.objectContaining({ href: 'https://github.com/jamie' }),
      },
    ]);
    expect(result.profileUrl).toBe('https://example.com/team/jamie');
  });
});
