import { relatedPostAnchorQuery } from './anchor.query';

describe('relatedPostAnchorQuery', () => {
  it('filters to page_post documents by id', () => {
    expect(relatedPostAnchorQuery.query).toContain('_type == "page_post"');
    expect(relatedPostAnchorQuery.query).toContain('_id == $postId');
  });

  it('parses null as no matching anchor post, rather than throwing', () => {
    expect(relatedPostAnchorQuery.parse(null)).toBeNull();
  });
});
