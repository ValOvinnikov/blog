import { at, set } from 'sanity/migrate';

import { localizedString } from '../lib/in-default-locale';

import { localizeFeatureListText } from './index';

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizeFeatureListText, () => {
  it('moves a Feature List module heading block into the default language', () => {
    expect(
      localizeFeatureListText({
        _type: 'module_featureList',
        headingBlock: { _type: 'headingBlock', heading: 'What you get' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: localizedString('What you get'),
        }),
      ),
    ]);
  });

  it('moves a feature heading block and image alt into the default language', () => {
    expect(
      localizeFeatureListText({
        _type: 'block_feature',
        headingBlock: { _type: 'headingBlock', heading: 'Fast' },
        image: { _type: 'imageWithAlt', asset, alt: 'A rocket' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: localizedString('Fast'),
        }),
      ),
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('A rocket'),
        }),
      ),
    ]);
  });

  it('is idempotent — an already localized feature is left alone', () => {
    expect(
      localizeFeatureListText({
        _type: 'block_feature',
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: localizedString('Fast'),
        },
        image: {
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('A rocket'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a feature with only an icon and no heading block alone', () => {
    expect(localizeFeatureListText({ _type: 'block_feature' })).toBeUndefined();
  });
});
