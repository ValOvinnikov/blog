import {
  MOCK_AUTHOR_ID,
  MOCK_AUTHOR_NAME,
} from '@blog/service/testing/entities/fixtures';
import { mockRawAuthor } from '@blog/service/testing/pages/fixtures';
import {
  mockLinkView,
  mockRawPersonBioBlock,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toPersonProfile } from './to-person-profile';

faker.seed(6103);

const MOCK_BIO_TEXT = faker.lorem.sentence();
const MOCK_ROLE = faker.person.jobTitle();
const MOCK_RAW_PROFILE = mockRawAuthor({ image: null, role: null });

describe(toPersonProfile, () => {
  it('maps a profile with no optional fields', () => {
    const profile = toPersonProfile(MOCK_RAW_PROFILE);

    expect(profile).toEqual({
      id: MOCK_AUTHOR_ID,
      name: MOCK_AUTHOR_NAME,
      image: undefined,
      role: undefined,
      bio: undefined,
      socialLinks: [],
      profileUrl: undefined,
    });
  });

  it('maps the role, bio and social links when populated', () => {
    const socialProfile = mockRawSocialProfile();
    const bioBlock = mockRawPersonBioBlock({ text: MOCK_BIO_TEXT });

    const { role, bio, socialLinks } = toPersonProfile({
      ...MOCK_RAW_PROFILE,
      role: MOCK_ROLE,
      bio: [bioBlock],
      socialLinks: [socialProfile],
    });

    expect(role).toBe(MOCK_ROLE);
    expect(bio).toEqual([{ ...bioBlock, markDefs: undefined }]);
    expect(socialLinks).toEqual([
      {
        platform: socialProfile.platform,
        link: mockLinkView({ href: socialProfile.link.url ?? undefined }),
      },
    ]);
  });
});
