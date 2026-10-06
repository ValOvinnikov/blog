import { validateLocalizedMaxLength } from './validate-localized-max-length';

const MESSAGE = 'Too long.';

describe(validateLocalizedMaxLength, () => {
  const validate = validateLocalizedMaxLength(5, MESSAGE);

  it('passes when every language fits', () => {
    expect(
      validate([
        { _key: 'EN', language: 'EN', value: 'Short' },
        { _key: 'NL', language: 'NL', value: 'Kort' },
      ]),
    ).toBe(true);
  });

  it('fails when any one language runs over', () => {
    expect(
      validate([
        { _key: 'EN', language: 'EN', value: 'Short' },
        { _key: 'NL', language: 'NL', value: 'Te lang' },
      ]),
    ).toBe(MESSAGE);
  });

  it('passes when the field is not set', () => {
    expect(validate(undefined)).toBe(true);
  });
});
