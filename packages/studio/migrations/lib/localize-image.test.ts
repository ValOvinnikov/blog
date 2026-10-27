import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeImage } from './localize-image';

faker.seed(6);

const { EN } = LOCALE_ISO_CODES;

const MOCK_ALT = faker.lorem.words();
const MOCK_ASSET = { _type: 'reference', _ref: faker.string.uuid() };

describe(localizeImage, () => {
  it('keeps the image and moves its alt text into the default language', () => {
    expect(
      localizeImage('image', {
        _type: 'imageWithAlt',
        asset: MOCK_ASSET,
        alt: MOCK_ALT,
      }),
    ).toEqual([
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset: MOCK_ASSET,
          alt: [
            {
              _key: EN,
              _type: 'internationalizedArrayStringValue',
              language: EN,
              value: MOCK_ALT,
            },
          ],
        }),
      ),
    ]);
  });

  it('leaves an already localized image alone', () => {
    expect(
      localizeImage('image', {
        _type: 'localizedImageWithAlt',
        asset: MOCK_ASSET,
      }),
    ).toEqual([]);
  });

  it('leaves a missing image alone', () => {
    expect(localizeImage('image', undefined)).toEqual([]);
  });
});
