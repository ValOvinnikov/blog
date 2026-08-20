import { makeRawTopic } from '@blog/service/testing/entities/fixtures';

import { topicPageTopicQuery } from './topic.query';

describe('topicPageTopicQuery', () => {
  it('parses a topic with no description', () => {
    const raw = makeRawTopic({ description: null });

    expect(() => topicPageTopicQuery.parse(raw)).not.toThrow();
  });
});
