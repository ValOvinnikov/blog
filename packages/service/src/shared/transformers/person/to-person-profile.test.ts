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
  it('maps the required fields', () => {
    const result = toPersonProfile(makeRaw());

    expect(result.id).toBe('person-1');
    expect(result.name).toBe('Jamie Rivera');
  });

  it('maps an image when present', () => {
    const result = toPersonProfile(
      makeRaw({ image: makeRawSanityImage('Jamie headshot') }),
    );

    expect(result.image).toMatchObject({ alt: 'Jamie headshot' });
  });

  it('returns undefined image when absent', () => {
    const result = toPersonProfile(makeRaw({ image: null }));

    expect(result.image).toBeUndefined();
  });

  it('returns undefined role when absent', () => {
    const result = toPersonProfile(makeRaw({ role: null }));

    expect(result.role).toBeUndefined();
  });

  it('maps a role when present', () => {
    const result = toPersonProfile(makeRaw({ role: 'Staff Engineer' }));

    expect(result.role).toBe('Staff Engineer');
  });

  it('returns undefined bio when absent', () => {
    const result = toPersonProfile(makeRaw({ bio: null }));

    expect(result.bio).toBeUndefined();
  });

  it('maps bio blocks when present', () => {
    const result = toPersonProfile(
      makeRaw({ bio: [makeRawPersonBioBlock({ text: 'Builds things.' })] }),
    );

    expect(result.bio?.[0]).toMatchObject({
      children: [{ text: 'Builds things.' }],
    });
  });

  it('returns an empty array when socialLinks is absent', () => {
    const result = toPersonProfile(makeRaw({ socialLinks: null }));

    expect(result.socialLinks).toEqual([]);
  });

  it('resolves socialLinks through the shared social profile resolver', () => {
    const result = toPersonProfile(
      makeRaw({
        socialLinks: [
          makeRawSocialProfile({
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: makeRawExternalLinkDocument({
              url: 'https://github.com/jamie',
            }),
          }),
        ],
      }),
    );

    expect(result.socialLinks).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: expect.objectContaining({ href: 'https://github.com/jamie' }),
      },
    ]);
  });

  it('returns undefined profileUrl when profilePage is absent', () => {
    const result = toPersonProfile(makeRaw({ profilePage: null }));

    expect(result.profileUrl).toBeUndefined();
  });

  it('resolves profileUrl through the shared link resolver', () => {
    const result = toPersonProfile(
      makeRaw({
        profilePage: makeRawExternalLinkDocument({
          url: 'https://example.com/team/jamie',
        }),
      }),
    );

    expect(result.profileUrl).toBe('https://example.com/team/jamie');
  });
});
