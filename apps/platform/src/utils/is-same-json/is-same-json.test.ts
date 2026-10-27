import { isSameJson } from './is-same-json';

const MOCK_ENTRIES = [{ a: 1, b: ['x'] }];
const MOCK_EDITED_ENTRIES = [{ a: 1, b: ['y'] }];

describe(isSameJson, () => {
  it('treats structurally equal values as the same', () => {
    expect(isSameJson(MOCK_ENTRIES, structuredClone(MOCK_ENTRIES))).toBe(true);
  });

  it('tells apart values that differ anywhere in the structure', () => {
    expect(isSameJson(MOCK_ENTRIES, MOCK_EDITED_ENTRIES)).toBe(false);
  });

  it('tells null apart from an empty value', () => {
    expect(isSameJson<string[] | null>(null, [])).toBe(false);
  });
});
