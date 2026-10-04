import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeHeroStatementModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

const strings = (value: string) =>
  inEnglish('internationalizedArrayStringValue', value);

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizeHeroStatementModule, () => {
  it('moves the heading, supporting text, eyebrow and image alt into the default language', () => {
    expect(
      localizeHeroStatementModule({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'Build calmly',
          supportingText: 'Notes on making things.',
        },
        eyebrow: 'Welcome',
        image: { _type: 'imageWithAlt', asset, alt: 'A desk' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: strings('Build calmly'),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'Notes on making things.',
          ),
        }),
      ),
      at('eyebrow', set(strings('Welcome'))),
      at(
        'image',
        set({ _type: 'localizedImageWithAlt', asset, alt: strings('A desk') }),
      ),
    ]);
  });

  it('is idempotent — an already localized hero is left alone', () => {
    expect(
      localizeHeroStatementModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('Build calmly'),
        },
        eyebrow: strings('Welcome'),
        image: {
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('A desk'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a hero without text alone', () => {
    expect(localizeHeroStatementModule({})).toBeUndefined();
  });
});
