import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeImage } from './localize-image';

const { EN } = LOCALE_ISO_CODES;

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizeImage, () => {
  it('keeps the image and moves its alt text into the default language', () => {
    expect(
      localizeImage({ _type: 'imageWithAlt', asset, alt: 'A desk' }),
    ).toEqual([
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: [
            {
              _key: EN,
              _type: 'internationalizedArrayStringValue',
              language: EN,
              value: 'A desk',
            },
          ],
        }),
      ),
    ]);
  });

  it('leaves an already localized image alone', () => {
    expect(localizeImage({ _type: 'localizedImageWithAlt', asset })).toEqual(
      [],
    );
  });

  it('leaves a missing image alone', () => {
    expect(localizeImage(undefined)).toEqual([]);
  });
});
