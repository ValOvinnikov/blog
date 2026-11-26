import { isPlainObject, toOptions, toTitleCase } from './objects';

describe(toTitleCase, () => {
  it.each([
    ['a single word', 'CONSOLE', 'Console'],
    [
      'an underscore-separated multi-word value',
      'POST_CATEGORY',
      'Post Category',
    ],
    ['a single-letter value', 'X', 'X'],
  ])('title-cases %s', (_label, value, expected) => {
    expect(toTitleCase(value)).toBe(expected);
  });
});

describe(toOptions, () => {
  it('pairs each value with its label, in declaration order', () => {
    const options = toOptions(
      { CARD: 'CARD', HUB: 'HUB' },
      (value) => `label-${value}`,
    );

    expect(options).toEqual([
      { value: 'CARD', label: 'label-CARD' },
      { value: 'HUB', label: 'label-HUB' },
    ]);
  });
});

describe(isPlainObject, () => {
  it('accepts an object', () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it.each([[null], [[]], ['a'], [1], [undefined]])('rejects %j', (value) => {
    expect(isPlainObject(value)).toBe(false);
  });
});
