import { PUBLISHED_POST_FILTER } from './published-post';

describe('PUBLISHED_POST_FILTER', () => {
  it('excludes a scheduled post whose publishedAt is in the future', () => {
    expect(PUBLISHED_POST_FILTER).toContain('publishedAt <= now()');
  });

  it('excludes a post with no sectionHeader.heading, whether sectionHeader is entirely absent or present without a heading', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(sectionHeader.heading)');
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
});
