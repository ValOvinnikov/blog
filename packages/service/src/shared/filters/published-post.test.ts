import { PUBLISHED_POST_FILTER } from './published-post';

describe('PUBLISHED_POST_FILTER', () => {
  it('excludes a scheduled post whose publishedAt is in the future', () => {
    expect(PUBLISHED_POST_FILTER).toContain('publishedAt <= now()');
  });

  it('excludes a post with no sectionHeader.heading, whether sectionHeader is entirely absent or present without a heading', () => {
    expect(PUBLISHED_POST_FILTER).toContain('defined(sectionHeader.heading)');
  });
});
