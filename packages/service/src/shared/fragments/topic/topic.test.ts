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
  it.each([
    {
      behaviour: 'accepts a topic with a title and a resolved page slug',
      projected: {
        _id: MOCK_TOPIC_ID,
        title: MOCK_TOPIC_TITLE,
        slug: MOCK_TOPIC_SLUG,
        description: MOCK_TOPIC_DESCRIPTION,
      },
    },
    {
      behaviour: 'accepts a topic with no topic page as a null slug',
      projected: {
        _id: MOCK_TOPIC_ID,
        title: MOCK_TOPIC_TITLE,
        slug: null,
        description: null,
      },
    },
  ])('$behaviour', ({ projected }) => {
    const topic = topicDocQuery.parse(projected);

    expect(topic).toEqual(projected);
  });

  it('throws when the required title is missing', () => {
    const projected = {
      _id: MOCK_TOPIC_ID,
      title: null,
      slug: MOCK_TOPIC_SLUG,
      description: null,
    };

    expect(() => topicDocQuery.parse(projected)).toThrow();
  });
});
