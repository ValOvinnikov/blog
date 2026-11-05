import {
  hasArrayGotItems,
  hasArrayGotMultipleItems,
  hasLength,
} from './arrays';

const REJECTS = 'rejects %j';

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

describe(hasArrayGotMultipleItems, () => {
  it('accepts an array with at least two items', () => {
    expect(hasArrayGotMultipleItems([undefined, undefined])).toBe(true);
  });

  it.each([[[undefined]], [[]], [undefined]])(REJECTS, (value) => {
    expect(hasArrayGotMultipleItems(value)).toBe(false);
  });
});

describe(hasLength, () => {
  it.each([[['a']], ['a']])('accepts %j', (value) => {
    expect(hasLength(value)).toBe(true);
  });

  it.each([[[]], [''], [undefined]])(REJECTS, (value) => {
    expect(hasLength(value)).toBe(false);
  });
});
