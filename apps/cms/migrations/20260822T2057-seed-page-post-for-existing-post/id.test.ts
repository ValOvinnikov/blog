import { toPagePostId } from './id';

describe('toPagePostId', () => {
  it('prefixes a published blog_post id', () => {
    expect(toPagePostId('abc123')).toBe('page_post-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPagePostId('drafts.abc123')).toBe('drafts.page_post-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toPagePostId('page_post-abc123')).toBe('page_post-abc123');
  });
});
