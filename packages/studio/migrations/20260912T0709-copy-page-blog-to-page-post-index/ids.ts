const DRAFTS_PREFIX = 'drafts.';

export const PAGE_BLOG_TYPE = 'page_blog';
export const PAGE_POST_INDEX_TYPE = 'page_postIndex';

/**
 * Maps the fixed `page_blog` singleton ids (published + draft) to their
 * `page_postIndex` counterparts. A singleton's document id equals its schema
 * type name, so the same `*_TYPE` constants serve both roles.
 */
export const PAGE_BLOG_TO_POST_INDEX_ID_MAP: ReadonlyMap<string, string> =
  new Map([
    [PAGE_BLOG_TYPE, PAGE_POST_INDEX_TYPE],
    [
      `${DRAFTS_PREFIX}${PAGE_BLOG_TYPE}`,
      `${DRAFTS_PREFIX}${PAGE_POST_INDEX_TYPE}`,
    ],
  ]);
