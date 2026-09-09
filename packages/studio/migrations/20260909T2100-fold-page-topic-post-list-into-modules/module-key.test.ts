import { toPostListModuleKey } from './module-key';

describe(toPostListModuleKey, () => {
  it('is deterministic for the same reference', () => {
    expect(toPostListModuleKey('postList-abc')).toBe(
      toPostListModuleKey('postList-abc'),
    );
  });

  it('differs across references', () => {
    expect(toPostListModuleKey('postList-abc')).not.toBe(
      toPostListModuleKey('postList-def'),
    );
  });

  it('is prefixed and hex-encoded', () => {
    expect(toPostListModuleKey('postList-abc')).toMatch(
      /^postList-[0-9a-f]{12}$/,
    );
  });
});
