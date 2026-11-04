import { hasArrayGotItems, hasLength } from './arrays';

describe(hasArrayGotItems, () => {
  it('accepts an array with at least one item', () => {
    expect(hasArrayGotItems([undefined])).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(hasArrayGotItems([])).toBe(false);
  });

  it('rejects a missing array', () => {
    expect(hasArrayGotItems(undefined)).toBe(false);
  });
});

describe(hasLength, () => {
  it.each([[['a']], ['a']])('accepts %j', (value) => {
    expect(hasLength(value)).toBe(true);
  });

  it.each([[[]], [''], [undefined]])('rejects %j', (value) => {
    expect(hasLength(value)).toBe(false);
  });
});
