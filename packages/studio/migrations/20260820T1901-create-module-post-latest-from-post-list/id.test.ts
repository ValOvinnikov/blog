import { toPostLatestId } from './id';

describe('toPostLatestId', () => {
  it('prefixes a published module_postList id', () => {
    expect(toPostLatestId('abc123')).toBe('postLatest-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPostLatestId('drafts.abc123')).toBe('drafts.postLatest-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toPostLatestId('postLatest-abc123')).toBe('postLatest-abc123');
  });
});
