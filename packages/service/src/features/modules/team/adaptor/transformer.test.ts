import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import {
  makeRawTeamMember,
  makeRawTeamModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawExternalLinkDocument,
  makeRawPersonBioBlock,
  makeRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toTeamModule } from './transformer';

describe(toTeamModule, () => {
  it('maps a full module', () => {
    const raw = makeRawTeamModule({
      showBios: true,
      showSocialLinks: true,
      imageShape: CARD_IMAGE_SHAPE.SQUARE,
      displayMode: DISPLAY_MODE.CAROUSEL,
      cardAlignment: CONTENT_ALIGNMENT.LEFT,
      members: [
        makeRawTeamMember({
          _id: 'person-1',
          name: 'Jamie Rivera',
          role: 'Staff Engineer',
          bio: [
            makeRawPersonBioBlock({
              _key: 'bio-block-1',
              text: 'Builds things.',
            }),
          ],
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
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members[0]?.profileUrl).toBe(
      'https://example.com/team/jamie',
    );
    expect(module.members[0]?.bio).toBeDefined();
    expect(module.members[0]?.socialLinks).toHaveLength(1);
  });

  it('keeps the members in authored order', () => {
    const raw = makeRawTeamModule({
      members: [
        makeRawTeamMember({ _id: 'person-1', name: 'Jamie Rivera' }),
        makeRawTeamMember({ _id: 'person-3', name: 'Sam Okafor' }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members.map((member) => member.id)).toEqual([
      'person-1',
      'person-3',
    ]);
  });

  it('leaves out bios and links when their switches are off', () => {
    const raw = makeRawTeamModule({
      showBios: false,
      showSocialLinks: false,
      members: [
        makeRawTeamMember({
          bio: [makeRawPersonBioBlock({ text: 'Hi.' })],
          socialLinks: [
            makeRawSocialProfile({ platform: SOCIAL_PLATFORMS.GITHUB }),
          ],
        }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members[0]?.bio).toBeUndefined();
    expect(module.members[0]?.socialLinks).toEqual([]);
  });
});
