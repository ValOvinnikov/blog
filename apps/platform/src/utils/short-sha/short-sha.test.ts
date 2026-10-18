import { shortSha } from './short-sha';

describe(shortSha, () => {
  it('keeps the first seven characters of a commit sha', () => {
    expect(shortSha('0123456789abcdef')).toBe('0123456');
  });
});
