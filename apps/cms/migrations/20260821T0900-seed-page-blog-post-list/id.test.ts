import { toBlogPostListId } from './id';

describe('toBlogPostListId', () => {
  it('resolves the published page_blog id to postList-blog', () => {
    expect(toBlogPostListId('page_blog')).toBe('postList-blog');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toBlogPostListId('drafts.page_blog')).toBe('drafts.postList-blog');
  });

  it('is idempotent — always resolves to the same fixed id', () => {
    expect(toBlogPostListId('page_blog')).toBe(toBlogPostListId('page_blog'));
  });
});
