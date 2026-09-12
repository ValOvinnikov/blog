const DRAFTS_PREFIX = 'drafts.';

export const PAGE_BLOG_ID = 'page_blog';
export const PAGE_POST_INDEX_ID = 'page_postIndex';

/** Maps the fixed `page_blog` singleton ids (published + draft) to their `page_postIndex` counterparts. */
export const PAGE_BLOG_TO_POST_INDEX_ID_MAP: ReadonlyMap<string, string> =
  new Map([
    [PAGE_BLOG_ID, PAGE_POST_INDEX_ID],
    [
      `${DRAFTS_PREFIX}${PAGE_BLOG_ID}`,
      `${DRAFTS_PREFIX}${PAGE_POST_INDEX_ID}`,
    ],
  ]);
