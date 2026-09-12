import { PUBLISHED_POST_FILTER } from './published-post';

describe('PUBLISHED_POST_FILTER', () => {
  it('excludes a scheduled post whose publishedAt is in the future', () => {
    expect(PUBLISHED_POST_FILTER).toContain('publishedAt <= now()');
  });

  it('excludes a post with no headingBlock.heading, whether headingBlock is entirely absent or present without a heading', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(headingBlock.heading)');
  });

  it('excludes a post with no author', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(author)');
  });

  it('excludes a post with no topic', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(topic)');
  });

  it('excludes a post with no content', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(content)');
  });

  it('excludes a post with no seo.metaTitle, whether seo is entirely absent or present without a metaTitle', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(seo.metaTitle)');
  });

  it('is exactly the expected predicate', () => {
    expect(PUBLISHED_POST_FILTER).toBe(
      'publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content) && defined(seo.metaTitle)',
    );
  });
});
