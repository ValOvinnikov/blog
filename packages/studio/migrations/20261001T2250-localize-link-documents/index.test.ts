import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeLinkDocument } from './index';

const { EN } = LOCALE_ISO_CODES;

const localized = (value: string) => [
  {
    _key: EN,
    _type: 'internationalizedArrayStringValue',
    language: EN,
    value,
  },
];

describe(localizeLinkDocument, () => {
  it('moves a plain label into the default language', () => {
    expect(localizeLinkDocument({ label: 'About us' })).toEqual([
      at('label', set(localized('About us'))),
    ]);
  });

  it('moves a plain url into the default language alongside the label', () => {
    expect(
      localizeLinkDocument({ label: 'Docs', url: 'https://example.com' }),
    ).toEqual([
      at('label', set(localized('Docs'))),
      at('url', set(localized('https://example.com'))),
    ]);
  });

  it('is idempotent — an already localized link is left alone', () => {
    expect(
      localizeLinkDocument({
        label: localized('About us'),
        url: localized('https://example.com'),
      }),
    ).toBeUndefined();
  });

  it('leaves a link without a label or url alone', () => {
    expect(localizeLinkDocument({})).toBeUndefined();
  });
});
