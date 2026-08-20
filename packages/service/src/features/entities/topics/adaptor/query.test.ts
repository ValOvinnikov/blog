import { makeRawTopicWithPostCount } from '@blog/service/testing/entities/fixtures';

import { topicsQuery } from './query';

describe('topicsQuery', () => {
  it('parses a topic with no description and a post count', () => {
    const raw = [
      makeRawTopicWithPostCount({ description: null, postCount: 5 }),
    ];

    expect(() => topicsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the post count', () => {
    expect(topicsQuery.query).toContain('publishedAt <= now()');
  });
});
