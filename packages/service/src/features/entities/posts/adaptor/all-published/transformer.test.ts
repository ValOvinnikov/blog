import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { toAllPublishedPosts } from './transformer';

describe(toAllPublishedPosts, () => {
  it('maps every raw feed post into a domain feed post', () => {
    const raw = [
      makeRawFeedPost({
        headingBlock: makeRawHeadingBlock('First', {
          supportingText: 'A sufficiently long excerpt for the card.',
        }),
        slug: 'first',
      }),
      makeRawFeedPost({
        headingBlock: makeRawHeadingBlock('Second', {
          supportingText: 'A sufficiently long excerpt for the card.',
        }),
        slug: 'second',
      }),
    ];

    const result = toAllPublishedPosts(raw);

    expect(result).toEqual([
      {
        title: 'First',
        slug: 'first',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
      {
        title: 'Second',
        slug: 'second',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
    ]);
  });

  it('returns an empty array when there are no matches', () => {
    expect(toAllPublishedPosts([])).toEqual([]);
  });

  it('does not include author, image, topic, or word-count fields', () => {
    const [result] = toAllPublishedPosts([makeRawFeedPost()]);

    expect(result).not.toHaveProperty('author');
    expect(result).not.toHaveProperty('heroImageUrl');
    expect(result).not.toHaveProperty('topic');
    expect(result).not.toHaveProperty('readingTimeMinutes');
  });

  it('maps a sparse feed post with no excerpt to undefined', () => {
    const [result] = toAllPublishedPosts([
      makeRawFeedPost({
        headingBlock: makeRawHeadingBlock('Hello World'),
      }),
    ]);

    expect(result?.excerpt).toBeUndefined();
  });
});
