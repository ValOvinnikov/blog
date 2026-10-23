import { mockRawTopicWithPostCount } from '@blog/service/testing/entities/fixtures';

import { topicsQuery } from './query';

describe('topicsQuery', () => {
  it('parses a topic with no description and a post count', () => {
    const raw = [
      mockRawTopicWithPostCount({ description: null, postCount: 5 }),
    ];

    expect(() => topicsQuery.parse(raw)).not.toThrow();
  });
});
