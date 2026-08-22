import { topicPaginationParamsQuery } from './query';

describe('topicPaginationParamsQuery', () => {
  it('parses a topic page slug with a postList slot and a post count', () => {
    const raw = [
      { slug: 'engineering', postList: { pageSize: 9 }, postCount: 5 },
    ];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic page with no postList slot set and zero posts', () => {
    const raw = [{ slug: 'empty', postList: null, postCount: 0 }];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the post count', () => {
    expect(topicPaginationParamsQuery.query).toContain('publishedAt <= now()');
  });

  it('correlates the post count to the enclosing topic page by reference', () => {
    expect(topicPaginationParamsQuery.query).toContain(
      'references(^.topic._ref)',
    );
  });
});
