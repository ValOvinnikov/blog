import { toBlogPostListId } from './id';

const PAGE_BLOG_ID = 'page_blog';
const BLOG_POST_LIST_ID = 'postList-blog';

describe(toBlogPostListId, () => {
  it.each([
    ['a published page', PAGE_BLOG_ID, BLOG_POST_LIST_ID],
    [
      'a draft page, keeping the drafts prefix outermost',
      `drafts.${PAGE_BLOG_ID}`,
      `drafts.${BLOG_POST_LIST_ID}`,
    ],
  ])('resolves the post list id for %s', (_label, pageBlogId, expected) => {
    const result = toBlogPostListId(pageBlogId);

    expect(result).toBe(expected);
  });
});
