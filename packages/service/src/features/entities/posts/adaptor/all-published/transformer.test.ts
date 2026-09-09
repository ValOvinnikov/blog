import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';

import { toAllPublishedPosts } from './transformer';

describe(toAllPublishedPosts, () => {
  it('maps every raw feed post into a domain feed post', () => {
    const raw = [
      makeRawFeedPost({
        sectionHeader: {
          heading: 'First',
          supportingText: 'A sufficiently long excerpt for the card.',
        },
        slug: 'first',
      }),
      makeRawFeedPost({
        sectionHeader: {
          heading: 'Second',
          supportingText: 'A sufficiently long excerpt for the card.',
        },
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
        sectionHeader: { heading: 'Hello World', supportingText: null },
      }),
    ]);

    expect(result?.excerpt).toBeUndefined();
  });

  it('maps an entirely absent sectionHeader to undefined title and excerpt', () => {
    const [result] = toAllPublishedPosts([
      makeRawFeedPost({ sectionHeader: null }),
    ]);

    expect(result?.title).toBeUndefined();
    expect(result?.excerpt).toBeUndefined();
  });
});
