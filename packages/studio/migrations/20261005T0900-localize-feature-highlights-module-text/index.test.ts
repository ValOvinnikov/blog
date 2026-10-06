import { at, set } from 'sanity/migrate';

import { inDefaultLocale, localizedString } from '../lib/in-default-locale';

import { localizeFeatureHighlightsModule } from './index';

const asset = { _type: 'reference', _ref: 'image-1' };

const paragraph = (text: string) => [
  { _type: 'block', _key: text, children: [{ _type: 'span', text }] },
];

const row = (key: string) => ['highlights', { _key: key }];

describe(localizeFeatureHighlightsModule, () => {
  it('moves the heading block and every row into the default language', () => {
    expect(
      localizeFeatureHighlightsModule({
        headingBlock: { _type: 'headingBlock', heading: 'Why teams switch' },
        highlights: [
          {
            _key: 'row-1',
            heading: 'Ship faster',
            body: paragraph('Less friction.'),
            image: { _type: 'imageWithAlt', asset, alt: 'A rocket' },
          },
          {
            _key: 'row-2',
            heading: 'Sleep better',
            body: paragraph('Fewer pages.'),
            image: { _type: 'imageWithAlt', asset, alt: 'A moon' },
          },
        ],
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: localizedString('Why teams switch'),
        }),
      ),
      at([...row('row-1'), 'heading'], set(localizedString('Ship faster'))),
      at(
        [...row('row-1'), 'body'],
        set(
          inDefaultLocale(
            'internationalizedArrayListedTextValue',
            paragraph('Less friction.'),
          ),
        ),
      ),
      at(
        [...row('row-1'), 'image'],
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('A rocket'),
        }),
      ),
      at([...row('row-2'), 'heading'], set(localizedString('Sleep better'))),
      at(
        [...row('row-2'), 'body'],
        set(
          inDefaultLocale(
            'internationalizedArrayListedTextValue',
            paragraph('Fewer pages.'),
          ),
        ),
      ),
      at(
        [...row('row-2'), 'image'],
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('A moon'),
        }),
      ),
    ]);
  });

  it('localizes only the rows still holding plain text', () => {
    expect(
      localizeFeatureHighlightsModule({
        highlights: [
          {
            _key: 'row-1',
            heading: localizedString('Ship faster'),
            image: { _type: 'localizedImageWithAlt', asset },
          },
          {
            _key: 'row-2',
            heading: 'Sleep better',
            image: { _type: 'localizedImageWithAlt', asset },
          },
        ],
      }),
    ).toEqual([
      at([...row('row-2'), 'heading'], set(localizedString('Sleep better'))),
    ]);
  });

  it('is idempotent — an already localized module is left alone', () => {
    expect(
      localizeFeatureHighlightsModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: localizedString('Why teams switch'),
        },
        highlights: [
          {
            _key: 'row-1',
            heading: localizedString('Ship faster'),
            body: inDefaultLocale(
              'internationalizedArrayListedTextValue',
              paragraph('Less friction.'),
            ),
            image: {
              _type: 'localizedImageWithAlt',
              asset,
              alt: localizedString('A rocket'),
            },
          },
        ],
      }),
    ).toBeUndefined();
  });

  it('leaves a module without text alone', () => {
    expect(localizeFeatureHighlightsModule({})).toBeUndefined();
  });
});
