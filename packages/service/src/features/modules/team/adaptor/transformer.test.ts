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

import { toTeamModule } from './transformer';

const PROFILE_URL = 'https://example.com/team/jamie';

describe(toTeamModule, () => {
  it('maps a full module', () => {
    const raw = mockRawTeamModule({
      showBios: true,
      showSocialLinks: true,
      imageShape: CARD_IMAGE_SHAPE.SQUARE,
      displayMode: DISPLAY_MODE.CAROUSEL,
      cardAlignment: CONTENT_ALIGNMENT.LEFT,
      members: [
        mockRawTeamMember({
          role: 'Staff Engineer',
          bio: [
            mockRawPersonBioBlock({
              _key: MOCK_BIO_BLOCK_KEY,
              text: 'Builds things.',
            }),
          ],
          socialLinks: [
            mockRawSocialProfile({
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: mockRawExternalLinkDocument({
                url: 'https://github.com/jamie',
              }),
            }),
          ],
          profilePage: mockRawExternalLinkDocument({ url: PROFILE_URL }),
        }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members[0]?.profileUrl).toBe(PROFILE_URL);
    expect(module.members[0]?.bio).toBeDefined();
    expect(module.members[0]?.socialLinks).toHaveLength(1);
  });

  it('keeps the members in authored order', () => {
    const raw = mockRawTeamModule({
      members: [
        mockRawTeamMember(),
        mockRawTeamMember({ _id: 'person-3', name: 'Sam Okafor' }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members.map((member) => member.id)).toEqual([
      'person-1',
      'person-3',
    ]);
  });

  it('leaves out bios and links when their switches are off', () => {
    const raw = mockRawTeamModule({
      showBios: false,
      showSocialLinks: false,
      members: [
        mockRawTeamMember({
          bio: [mockRawPersonBioBlock({ text: 'Hi.' })],
          socialLinks: [
            mockRawSocialProfile({ platform: SOCIAL_PLATFORMS.GITHUB }),
          ],
        }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members[0]?.bio).toBeUndefined();
    expect(module.members[0]?.socialLinks).toEqual([]);
  });
});
