import { POST_COUNT_EXPRESSION, postCountParser } from './post-count';

describe('POST_COUNT_EXPRESSION', () => {
  it('counts only published page_post documents referencing the enclosing document', () => {
    expect(POST_COUNT_EXPRESSION).toContain('_type == "page_post"');
    expect(POST_COUNT_EXPRESSION).toContain('references(^._id)');
  });

  it('excludes a scheduled (future-dated) post', () => {
    expect(POST_COUNT_EXPRESSION).toContain('publishedAt <= now()');
  });

  it('requires the fields PUBLISHED_POST_FILTER enforces', () => {
    expect(POST_COUNT_EXPRESSION).toContain('defined(headingBlock.heading)');
    expect(POST_COUNT_EXPRESSION).toContain('defined(author)');
    expect(POST_COUNT_EXPRESSION).toContain('defined(topic)');
    expect(POST_COUNT_EXPRESSION).toContain('defined(content)');
  });

  it('parses to a number', () => {
    expect(postCountParser.parse(5)).toBe(5);
  });
});
