import {
  PAGE_BLOG_TO_POST_INDEX_ID_MAP,
  PAGE_BLOG_TYPE,
  PAGE_POST_INDEX_TYPE,
} from './ids';

describe('copy-page-blog-to-page-post-index ids', () => {
  it('matches the page_blog and page_postIndex singleton Studio document ids', () => {
    expect(PAGE_BLOG_TYPE).toBe('page_blog');
    expect(PAGE_POST_INDEX_TYPE).toBe('page_postIndex');
  });

  it('maps both the published and draft page_blog id to their page_postIndex counterpart', () => {
    expect(PAGE_BLOG_TO_POST_INDEX_ID_MAP.get('page_blog')).toBe(
      'page_postIndex',
    );
    expect(PAGE_BLOG_TO_POST_INDEX_ID_MAP.get('drafts.page_blog')).toBe(
      'drafts.page_postIndex',
    );
  });
});
