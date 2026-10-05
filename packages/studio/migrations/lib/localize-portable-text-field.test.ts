import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizePortableTextField } from './localize-portable-text-field';

const { EN } = LOCALE_ISO_CODES;

const blocks = [{ _type: 'block', _key: 'block-1', children: [] }];

describe(localizePortableTextField, () => {
  it('moves plain Portable Text into the default language', () => {
    expect(localizePortableTextField('content', blocks)).toEqual([
      at(
        'content',
        set([
          {
            _key: EN,
            _type: 'internationalizedArrayListedTextValue',
            language: EN,
            value: blocks,
          },
        ]),
      ),
    ]);
  });

  it('leaves an already localized, empty or missing value alone', () => {
    expect(
      localizePortableTextField('content', [
        {
          _key: EN,
          _type: 'internationalizedArrayListedTextValue',
          language: EN,
          value: blocks,
        },
      ]),
    ).toEqual([]);
    expect(localizePortableTextField('content', [])).toEqual([]);
    expect(localizePortableTextField('content', undefined)).toEqual([]);
  });
});
