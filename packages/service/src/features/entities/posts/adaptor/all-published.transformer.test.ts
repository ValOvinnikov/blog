import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';

import { toAllPublishedPosts } from './all-published.transformer';

describe(toAllPublishedPosts, () => {
  it('maps every raw feed post into a domain feed post', () => {
    const raw = [
      makeRawFeedPost({ title: 'First', slug: 'first' }),
      makeRawFeedPost({ title: 'Second', slug: 'second' }),
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
});
