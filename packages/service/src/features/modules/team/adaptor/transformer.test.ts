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
import { makeRawExternalLinkDocument } from '@blog/service/testing/shared/fixtures';

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
            {
              _type: 'block',
              _key: 'bio-block-1',
              children: [
                { _type: 'span', _key: 'span-1', text: 'Builds things.' },
              ],
              markDefs: null,
            },
          ],
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: makeRawExternalLinkDocument({
                url: 'https://github.com/jamie',
              }),
            },
          ],
          profilePage: makeRawExternalLinkDocument({
            url: 'https://example.com/team/jamie',
          }),
        }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.showBios).toBe(true);
    expect(module.showSocialLinks).toBe(true);
    expect(module.imageShape).toBe(CARD_IMAGE_SHAPE.SQUARE);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.LEFT);
    expect(module.members).toEqual([
      {
        id: 'person-1',
        name: 'Jamie Rivera',
        image: undefined,
        role: 'Staff Engineer',
        bio: [
          {
            _type: 'block',
            _key: 'bio-block-1',
            children: [
              { _type: 'span', _key: 'span-1', text: 'Builds things.' },
            ],
            markDefs: undefined,
          },
        ],
        socialLinks: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: {
              label: 'Learn more',
              href: 'https://github.com/jamie',
              target: undefined,
              platform: undefined,
              ariaLabel: undefined,
            },
          },
        ],
        profileUrl: 'https://example.com/team/jamie',
      },
    ]);
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
          bio: [
            {
              _type: 'block',
              _key: 'bio-block-1',
              children: [{ _type: 'span', _key: 'span-1', text: 'Hi.' }],
              markDefs: null,
            },
          ],
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: makeRawExternalLinkDocument(),
            },
          ],
        }),
      ],
    });

    const module = toTeamModule(raw);

    expect(module.members[0]?.bio).toBeUndefined();
    expect(module.members[0]?.socialLinks).toEqual([]);
  });
});
