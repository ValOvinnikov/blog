import { describe, expect, expectTypeOf, it } from 'vitest';

import { objectKeys } from './objects';

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
