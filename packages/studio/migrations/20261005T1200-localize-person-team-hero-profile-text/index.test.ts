import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizePersonTeamHeroProfile } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

const strings = (value: string) =>
  inEnglish('internationalizedArrayStringValue', value);

const paragraph = (text: string) => [
  {
    _type: 'block',
    _key: text,
    style: 'normal',
    children: [{ _type: 'span', _key: 'span', text, marks: [] }],
    markDefs: [],
  },
];

const paragraphs = (text: string) =>
  inEnglish('internationalizedArrayParagraphTextValue', paragraph(text));

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizePersonTeamHeroProfile, () => {
  it("moves a person's role, bio and photo alt into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'person',
        role: 'Founder',
        bio: paragraph('Writes about design.'),
        image: { _type: 'imageWithAlt', asset, alt: 'Jane smiling' },
      }),
    ).toEqual([
      at('role', set(strings('Founder'))),
      at('bio', set(paragraphs('Writes about design.'))),
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('Jane smiling'),
        }),
      ),
    ]);
  });

  it("moves a Team module's heading block into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'module_team',
        headingBlock: { _type: 'headingBlock', heading: 'Our team' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({ _type: 'localizedHeadingBlock', heading: strings('Our team') }),
      ),
    ]);
  });

  it("moves a Profile Hero's heading block and image alt into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'module_heroProfile',
        headingBlock: { _type: 'headingBlock', heading: 'Meet Jane' },
        image: { _type: 'imageWithAlt', asset, alt: 'Jane at work' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({ _type: 'localizedHeadingBlock', heading: strings('Meet Jane') }),
      ),
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('Jane at work'),
        }),
      ),
    ]);
  });

  it('is idempotent — already localized documents are left alone', () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'person',
        role: strings('Founder'),
        bio: paragraphs('Writes about design.'),
        image: {
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('Jane smiling'),
        },
      }),
    ).toBeUndefined();
    expect(
      localizePersonTeamHeroProfile({
        _type: 'module_heroProfile',
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('Meet Jane'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a person without role, bio or photo alone', () => {
    expect(localizePersonTeamHeroProfile({ _type: 'person' })).toBeUndefined();
  });
});
