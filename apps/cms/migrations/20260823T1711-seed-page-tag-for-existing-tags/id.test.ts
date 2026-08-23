import { toPageTagId, toTagPostListId } from './id';

describe('toPageTagId', () => {
  it('prefixes a published blog_tag id', () => {
    expect(toPageTagId('abc123')).toBe('page_tag-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPageTagId('drafts.abc123')).toBe('drafts.page_tag-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toPageTagId('page_tag-abc123')).toBe('page_tag-abc123');
  });
});

describe('toTagPostListId', () => {
  it('prefixes a published blog_tag id', () => {
    expect(toTagPostListId('abc123')).toBe('postList-tag-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toTagPostListId('drafts.abc123')).toBe('drafts.postList-tag-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toTagPostListId('postList-tag-abc123')).toBe('postList-tag-abc123');
  });

  it('produces distinct ids from toPageTagId for the same tag', () => {
    expect(toTagPostListId('abc123')).not.toBe(toPageTagId('abc123'));
  });
});
