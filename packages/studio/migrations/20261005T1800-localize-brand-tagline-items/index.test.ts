import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeBrandTaglineItems } from './index';

const { EN } = LOCALE_ISO_CODES;

const item = (key: string, text: string) => ({
  _key: key,
  _type: 'brandTaglineItem',
  text: [
    {
      _key: EN,
      _type: 'internationalizedArrayStringValue',
      language: EN,
      value: text,
    },
  ],
});

const itemsPath = ['brand', 'tagline', 'items'];

describe(localizeBrandTaglineItems, () => {
  it('turns each tagline item into an item object with its text in the default language', () => {
    expect(
      localizeBrandTaglineItems({
        brand: { tagline: { items: ['build 2026.07', 'online'] } },
      }),
    ).toEqual([
      at(
        itemsPath,
        set([item('item-1', 'build 2026.07'), item('item-2', 'online')]),
      ),
    ]);
  });

  it('is idempotent — already localized items are left alone', () => {
    expect(
      localizeBrandTaglineItems({
        brand: {
          tagline: {
            items: [item('item-1', 'build 2026.07'), item('item-2', 'online')],
          },
        },
      }),
    ).toBeUndefined();
  });

  it('leaves settings without a tagline alone', () => {
    expect(localizeBrandTaglineItems({ brand: {} })).toBeUndefined();
    expect(localizeBrandTaglineItems({})).toBeUndefined();
  });
});
