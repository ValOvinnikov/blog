import { isSameJson } from './is-same-json';

describe('isSameJson', () => {
  it('treats structurally equal values as the same', () => {
    expect(isSameJson([{ a: 1, b: ['x'] }], [{ a: 1, b: ['x'] }])).toBe(true);
  });

  it('tells apart values that differ anywhere in the structure', () => {
    expect(isSameJson([{ a: 1, b: ['x'] }], [{ a: 1, b: ['y'] }])).toBe(false);
  });

  it('tells null apart from an empty value', () => {
    expect(isSameJson<string[] | null>(null, [])).toBe(false);
  });
});
