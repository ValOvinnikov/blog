import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizePortableTextField } from './localize-portable-text-field';

const { EN } = LOCALE_ISO_CODES;

const blocks = [{ _type: 'block', _key: 'b1', children: [] }];

describe(localizePortableTextField, () => {
  it('moves plain portable text into the default language', () => {
    expect(
      localizePortableTextField(
        'body',
        blocks,
        'internationalizedArrayParagraphTextValue',
      ),
    ).toEqual([
      at(
        'body',
        set([
          {
            _key: EN,
            _type: 'internationalizedArrayParagraphTextValue',
            language: EN,
            value: blocks,
          },
        ]),
      ),
    ]);
  });

  it('leaves an already localized, empty or missing value alone', () => {
    const type = 'internationalizedArrayParagraphTextValue';

    expect(
      localizePortableTextField(
        'body',
        [{ _key: EN, _type: type, language: EN, value: blocks }],
        type,
      ),
    ).toEqual([]);
    expect(localizePortableTextField('body', [], type)).toEqual([]);
    expect(localizePortableTextField('body', undefined, type)).toEqual([]);
  });
});
