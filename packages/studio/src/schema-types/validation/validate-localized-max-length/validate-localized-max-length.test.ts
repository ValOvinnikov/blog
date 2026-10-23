import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';

import { validateLocalizedMaxLength } from './validate-localized-max-length';

const { EN, NL } = LOCALE_ISO_CODES;

const MESSAGE = 'Too long.';

describe(validateLocalizedMaxLength, () => {
  const validate = validateLocalizedMaxLength(5, MESSAGE);

  it.each([
    [
      'passes when every language fits',
      [mockLocalizedValue(EN, 'Short'), mockLocalizedValue(NL, 'Kort')],
      true,
    ],
    [
      'fails when any one language runs over',
      [mockLocalizedValue(EN, 'Short'), mockLocalizedValue(NL, 'Te lang')],
      MESSAGE,
    ],
    ['passes when the field is not set', undefined, true],
  ])('%s', (_description, value, expected) => {
    expect(validate(value)).toBe(expected);
  });
});
