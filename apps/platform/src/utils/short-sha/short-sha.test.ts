import { shortSha } from './short-sha';

const MOCK_COMMIT_SHA = '0123456789abcdef';
const MOCK_SHORT_COMMIT_SHA = '0123456';

describe(shortSha, () => {
  it('keeps the first seven characters of a commit sha', () => {
    expect(shortSha(MOCK_COMMIT_SHA)).toBe(MOCK_SHORT_COMMIT_SHA);
  });
});
