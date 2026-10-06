import { q } from '@blog/service/sanity/query/query';

import { topicFragment } from './topic';

const topicDocQuery = q.star
  .filterByType('blog_topic')
  .slice(0)
  .project(topicFragment);

describe('topicFragment', () => {
  it('accepts a fully-projected topic (title and resolved slug present)', () => {
    const projected = {
      _id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
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
