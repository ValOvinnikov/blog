import { objectKeys, toOptions, toTitleCase } from './objects';

describe(objectKeys, () => {
  it("returns the object's keys", () => {
    expect(objectKeys({ a: 1, b: 2, c: 3 })).toEqual(['a', 'b', 'c']);
  });

  it('returns [] for an empty object', () => {
    expect(objectKeys({})).toEqual([]);
  });
});

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
