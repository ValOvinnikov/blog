import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  SOCIAL_PLATFORMS,
} from '@blog/config/constants';
import {
  mockRawTeamMember,
  mockRawTeamModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_BIO_BLOCK_KEY,
  mockRawExternalLinkDocument,
  mockRawPersonBioBlock,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toTeamModule } from './transformer';

faker.seed(9);

const MOCK_PROFILE_URL = faker.internet.url();
const MOCK_SOCIAL_URL = faker.internet.url();
const MOCK_FIRST_MEMBER_ID = faker.string.uuid();
const MOCK_SECOND_MEMBER_ID = faker.string.uuid();
const MOCK_ROLE = faker.person.jobTitle();
const MOCK_BIO_TEXT = faker.lorem.sentence();

describe(toTeamModule, () => {
  it('maps a full module', () => {
    const bioBlock = mockRawPersonBioBlock({
      _key: MOCK_BIO_BLOCK_KEY,
      text: MOCK_BIO_TEXT,
    });
    const raw = mockRawTeamModule({
      showBios: true,
      showSocialLinks: true,
      imageShape: CARD_IMAGE_SHAPE.SQUARE,
      displayMode: DISPLAY_MODE.CAROUSEL,
      cardAlignment: CONTENT_ALIGNMENT.LEFT,
      members: [
        mockRawTeamMember({
          role: MOCK_ROLE,
          bio: [bioBlock],
          socialLinks: [
            mockRawSocialProfile({
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: mockRawExternalLinkDocument({ url: MOCK_SOCIAL_URL }),
            }),
          ],
          profilePage: mockRawExternalLinkDocument({ url: MOCK_PROFILE_URL }),
        }),
      ],
    });

    const [member] = toTeamModule(raw).members;

    expect(member?.profileUrl).toBe(MOCK_PROFILE_URL);
    expect(member?.bio).toEqual([{ ...bioBlock, markDefs: undefined }]);
    expect(member?.socialLinks).toHaveLength(1);
  });

  it('keeps the members in authored order', () => {
    const raw = mockRawTeamModule({
      members: [
        mockRawTeamMember({ _id: MOCK_FIRST_MEMBER_ID }),
        mockRawTeamMember({ _id: MOCK_SECOND_MEMBER_ID }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members.map((member) => member.id)).toEqual([
      MOCK_FIRST_MEMBER_ID,
      MOCK_SECOND_MEMBER_ID,
    ]);
  });

  it('leaves out bios and links when their switches are off', () => {
    const raw = mockRawTeamModule({
      showBios: false,
      showSocialLinks: false,
      members: [
        mockRawTeamMember({
          bio: [mockRawPersonBioBlock({ text: MOCK_BIO_TEXT })],
          socialLinks: [
            mockRawSocialProfile({ platform: SOCIAL_PLATFORMS.GITHUB }),
          ],
        }),
      ],
    });

    const [member] = toTeamModule(raw).members;

    expect(member?.bio).toBeUndefined();
    expect(member?.socialLinks).toEqual([]);
  });
});
