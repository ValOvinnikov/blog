import { hasArrayGotItems } from './arrays';

describe(hasArrayGotItems, () => {
  it('accepts an array with at least one item', () => {
    expect(hasArrayGotItems([undefined])).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(hasArrayGotItems([])).toBe(false);
  });
});
