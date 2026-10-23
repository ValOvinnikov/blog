import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';

import { topicFragment } from './topic';

const topicDocQuery = q.star
  .filterByType('blog_topic')
  .slice(0)
  .project(topicFragment);

describe('topicFragment', () => {
  it('accepts a fully-projected topic (title and resolved slug present)', () => {
    const projected = {
      _id: MOCK_TOPIC_ID,
      title: MOCK_TOPIC_TITLE,
      slug: MOCK_TOPIC_SLUG,
      description: MOCK_TOPIC_DESCRIPTION,
    };

    expect(topicDocQuery.parse(projected)).toEqual(projected);
  });

  it('throws when the required title is missing', () => {
    const projected = {
      _id: 'topic-2',
      title: null,
      slug: 'no-title',
      description: null,
    };

    expect(() => topicDocQuery.parse(projected)).toThrow();
  });

  it('accepts a topic with no topic page as a null slug', () => {
    const projected = {
      _id: 'topic-3',
      title: 'No Page',
      slug: null,
      description: null,
    };

    expect(topicDocQuery.parse(projected)).toEqual(projected);
  });
});
