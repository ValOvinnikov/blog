import { objectKeys, toTitleCase } from './objects';

describe(objectKeys, () => {
  it("returns the object's keys", () => {
    expect(objectKeys({ a: 1, b: 2, c: 3 })).toEqual(['a', 'b', 'c']);
  });

  it('is typed as Array<keyof T>', () => {
    const obj = { name: 'Alice', age: 30 };
    expectTypeOf(objectKeys(obj)).toEqualTypeOf<Array<'name' | 'age'>>();
  });

  it('returns [] for an empty object', () => {
    expect(objectKeys({})).toEqual([]);
  });
});

describe(toTitleCase, () => {
  it('title-cases a single word', () => {
    expect(toTitleCase('CONSOLE')).toBe('Console');
  });

  it('title-cases an underscore-separated multi-word value', () => {
    expect(toTitleCase('POST_CATEGORY')).toBe('Post Category');
  });

  it('title-cases a single-letter value', () => {
    expect(toTitleCase('X')).toBe('X');
  });
});
