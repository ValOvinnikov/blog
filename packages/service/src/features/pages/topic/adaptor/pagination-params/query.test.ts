import { topicPaginationParamsQuery } from './query';

describe('topicPaginationParamsQuery', () => {
  it('parses a topic slug with a post count', () => {
    const raw = [{ slug: 'engineering', postCount: 5 }];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic with zero posts', () => {
    const raw = [{ slug: 'empty', postCount: 0 }];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the post count', () => {
    expect(topicPaginationParamsQuery.query).toContain('publishedAt <= now()');
  });
});
