import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { toArchivePostCard } from './to-archive-post-card';

describe(toArchivePostCard, () => {
  it('maps all fields from raw input', () => {
    const result = toArchivePostCard(makeRawArchivePostCard());

    expect(result.id).toBe('post-1');
    expect(result.title).toBe('Hello World');
    expect(result.slug).toBe('hello-world');
    expect(result.excerpt).toBe('A sufficiently long excerpt for the card.');
    expect(result.publishedAt).toBe('2026-01-15T00:00:00Z');
  });

  it('maps categories array', () => {
    const result = toArchivePostCard(makeRawArchivePostCard());

    expect(result.categories).toEqual([
      { id: 'cat-1', title: 'Engineering', slug: 'engineering' },
    ]);
  });

  it('does not include hero image, featured, or author fields', () => {
    const result = toArchivePostCard(makeRawArchivePostCard());

    expect(result).not.toHaveProperty('heroImageUrl');
    expect(result).not.toHaveProperty('featured');
    expect(result).not.toHaveProperty('author');
  });

  it('computes readingTimeMinutes from the server-computed word count', () => {
    const result = toArchivePostCard(
      makeRawArchivePostCard({ wordCount: 401 }),
    );

    expect(result.readingTimeMinutes).toBe(3);
  });

  it('rounds a wordless post up to a 1-minute read', () => {
    const result = toArchivePostCard(makeRawArchivePostCard({ wordCount: 0 }));

    expect(result.readingTimeMinutes).toBe(1);
  });
});
