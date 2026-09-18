import {
  getFieldOptionsLayout,
  getFieldOptionValues,
} from '@blog/studio/testing/get-field-options';

describe(getFieldOptionValues, () => {
  it('returns each option value, in order', () => {
    const field = {
      options: {
        list: [
          { title: 'One', value: 'ONE' },
          { title: 'Two', value: 'TWO' },
        ],
      },
    };

    expect(getFieldOptionValues(field)).toEqual(['ONE', 'TWO']);
  });

  it('throws when the field defines no options.list', () => {
    expect(() => getFieldOptionValues({})).toThrow(/options\.list/);
  });
});

describe(getFieldOptionsLayout, () => {
  it('returns the configured layout', () => {
    expect(
      getFieldOptionsLayout({ options: { layout: 'radio', list: [] } }),
    ).toBe('radio');
  });

  it('returns undefined when no layout is configured', () => {
    expect(getFieldOptionsLayout({ options: { list: [] } })).toBeUndefined();
  });

  it('returns undefined when the field defines no options at all', () => {
    expect(getFieldOptionsLayout({})).toBeUndefined();
  });
});
