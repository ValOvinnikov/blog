import { describe, expect, it } from 'vitest';

import { toTotalPages } from './to-total-pages';

describe('toTotalPages', () => {
  it('divides and rounds up to whole pages', () => {
    expect(toTotalPages(20, 9)).toBe(3);
    expect(toTotalPages(18, 9)).toBe(2);
  });

  it('returns 1 for an exact single page or fewer', () => {
    expect(toTotalPages(9, 9)).toBe(1);
    expect(toTotalPages(5, 9)).toBe(1);
  });

  it('returns at least 1 for an empty set', () => {
    expect(toTotalPages(0, 9)).toBe(1);
  });
});
