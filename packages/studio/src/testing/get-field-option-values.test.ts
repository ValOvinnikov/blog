import { getOptionValues } from '@blog/studio/testing/get-field-option-values';

describe(getOptionValues, () => {
  it('returns each option value, in order', () => {
    const field = {
      options: {
        list: [
          { title: 'One', value: 'ONE' },
          { title: 'Two', value: 'TWO' },
        ],
      },
    };

    expect(getOptionValues(field)).toEqual(['ONE', 'TWO']);
  });

  it('throws when the field defines no options.list', () => {
    expect(() => getOptionValues({})).toThrow(/options\.list/);
  });
});
