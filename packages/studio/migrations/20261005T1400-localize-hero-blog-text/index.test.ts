import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeHeroBlogModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const strings = (value: string) => [
  {
    _key: EN,
    _type: 'internationalizedArrayStringValue',
    language: EN,
    value,
  },
];

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizeHeroBlogModule, () => {
  it('moves the eyebrow, action label and image alt into the default language', () => {
    expect(
      localizeHeroBlogModule({
        eyebrow: 'Featured',
        primaryActionLabel: 'Read the post',
        image: { _type: 'imageWithAlt', asset, alt: 'A desk' },
      }),
    ).toEqual([
      at('eyebrow', set(strings('Featured'))),
      at('primaryActionLabel', set(strings('Read the post'))),
      at(
        'image',
        set({ _type: 'localizedImageWithAlt', asset, alt: strings('A desk') }),
      ),
    ]);
  });

  it('is idempotent — an already localized hero is left alone', () => {
    expect(
      localizeHeroBlogModule({
        eyebrow: strings('Featured'),
        primaryActionLabel: strings('Read the post'),
        image: {
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('A desk'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a hero without text alone', () => {
    expect(localizeHeroBlogModule({})).toBeUndefined();
  });
});
