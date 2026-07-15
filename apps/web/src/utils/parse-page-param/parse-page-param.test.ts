import { describe, expect, it } from 'vitest';

import { parsePageParam } from './parse-page-param';

describe('parsePageParam', () => {
  it('parses canonical positive integers', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('10')).toBe(10);
  });

  it('rejects non-canonical or non-numeric values', () => {
    for (const raw of ['0', '02', '-1', '1.5', 'abc', '', ' 2', '1e2', '2 ']) {
      expect(parsePageParam(raw)).toBeNull();
    }
  });
});
