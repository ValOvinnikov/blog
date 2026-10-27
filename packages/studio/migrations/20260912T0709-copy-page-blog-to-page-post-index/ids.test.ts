import {
  PAGE_BLOG_TO_POST_INDEX_ID_MAP,
  PAGE_BLOG_TYPE,
  PAGE_POST_INDEX_TYPE,
} from './ids';

const DRAFTS_PREFIX = 'drafts.';

describe('page_blog to page_postIndex id map', () => {
  it.each([
    ['published', PAGE_BLOG_TYPE, PAGE_POST_INDEX_TYPE],
    [
      'draft',
      `${DRAFTS_PREFIX}${PAGE_BLOG_TYPE}`,
      `${DRAFTS_PREFIX}${PAGE_POST_INDEX_TYPE}`,
    ],
  ])('maps the %s page_blog id to its page_postIndex id', (_kind, from, to) => {
    expect(PAGE_BLOG_TO_POST_INDEX_ID_MAP.get(from)).toBe(to);
  });
});
