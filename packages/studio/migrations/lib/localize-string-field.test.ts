import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeStringField } from './localize-string-field';

const { EN } = LOCALE_ISO_CODES;

describe(localizeStringField, () => {
  it('moves a plain string into the default language', () => {
    expect(localizeStringField('eyebrow', 'Welcome')).toEqual([
      at(
        'eyebrow',
        set([
          {
            _key: EN,
            _type: 'internationalizedArrayStringValue',
            language: EN,
            value: 'Welcome',
          },
        ]),
      ),
    ]);
  });

  it('leaves an already localized or missing value alone', () => {
    expect(localizeStringField('eyebrow', [{ _key: EN }])).toEqual([]);
    expect(localizeStringField('eyebrow', undefined)).toEqual([]);
  });
});
