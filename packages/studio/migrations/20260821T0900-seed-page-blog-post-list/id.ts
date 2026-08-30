const DRAFTS_PREFIX = 'drafts.';
const BLOG_POST_LIST_ID = 'postList-blog';

/**
 * `page_blog` is a singleton with a fixed document id, so the archive
 * `module_postList` it's seeded with gets a fixed id too — draft/published
 * mirrors whichever `page_blog` document is being migrated.
 */
export const toBlogPostListId = (pageBlogId: string): string =>
  pageBlogId.startsWith(DRAFTS_PREFIX)
    ? `${DRAFTS_PREFIX}${BLOG_POST_LIST_ID}`
    : BLOG_POST_LIST_ID;
