import {
  relatedByTagsQuery,
  relatedByTopicQuery,
  relatedPostAnchorQuery,
} from './posts.query';

describe('relatedPostAnchorQuery', () => {
  it('filters to page_post documents by id', () => {
    expect(relatedPostAnchorQuery.query).toContain('_type == "page_post"');
    expect(relatedPostAnchorQuery.query).toContain('_id == $postId');
  });

  it('parses null as no matching anchor post, rather than throwing', () => {
    expect(relatedPostAnchorQuery.parse(null)).toBeNull();
  });
});

describe('relatedByTagsQuery', () => {
  it('filters to page_post documents', () => {
    expect(relatedByTagsQuery.query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTagsQuery.query).toContain('publishedAt <= now()');
  });
});

describe('relatedByTopicQuery', () => {
  it('filters to page_post documents', () => {
    expect(relatedByTopicQuery(6).query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTopicQuery(6).query).toContain('publishedAt <= now()');
  });

  it('bounds the candidate pool by the given limit', () => {
    expect(relatedByTopicQuery(6).query).toContain('[0...6]');
    expect(relatedByTopicQuery(12).query).toContain('[0...12]');
  });
});
