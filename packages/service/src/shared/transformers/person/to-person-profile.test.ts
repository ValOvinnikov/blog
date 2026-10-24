import { mockRawAuthor } from '@blog/service/testing/pages/fixtures';
import {
  mockRawPersonBioBlock,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toPersonProfile } from './to-person-profile';

const BIO_TEXT = 'Builds things.';
const ROLE = 'Staff Engineer';

const rawProfile = mockRawAuthor({ image: null, role: null });

describe(toPersonProfile, () => {
  it('maps everything absent', () => {
    const result = toPersonProfile(rawProfile);

    expect(result).toEqual({
      id: rawProfile._id,
      name: rawProfile.name,
      image: undefined,
      role: undefined,
      bio: undefined,
      socialLinks: [],
      profileUrl: undefined,
    });
  });

  it('maps the role, bio and social links when populated', () => {
    const socialProfile = mockRawSocialProfile();

    const { role, bio, socialLinks } = toPersonProfile({
      ...rawProfile,
      role: ROLE,
      bio: [mockRawPersonBioBlock({ text: BIO_TEXT })],
      socialLinks: [socialProfile],
    });

    expect(role).toBe(ROLE);
    expect(bio?.[0]).toMatchObject({ children: [{ text: BIO_TEXT }] });
    expect(
      socialLinks.map(({ platform, link }) => [platform, link.href]),
    ).toEqual([[socialProfile.platform, socialProfile.link.url]]);
  });
});
