import { LINK_PAGE_TYPES } from '@blog/studio/schema-types/documents/link/link-page-types';

describe('LINK_PAGE_TYPES', () => {
  it('lists exactly the eight page document types, and no taxonomy terms', () => {
    expect(LINK_PAGE_TYPES).toEqual([
      'page_home',
      'page_landing',
      'page_post',
      'page_postIndex',
      'page_topic',
      'page_topicIndex',
      'page_tag',
      'page_tagIndex',
    ]);
  });
});
