import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { toPostCard } from './to-post-card';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/img-800x600.jpg',
  ),
}));

describe('toPostCard', () => {
  it('maps all fields from raw input', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.id).toBe('post-1');
    expect(result.title).toBe('Hello World');
    expect(result.slug).toBe('hello-world');
    expect(result.excerpt).toBe('A sufficiently long excerpt for the card.');
    expect(result.publishedAt).toBe('2026-01-15T00:00:00Z');
    expect(result.mainImageUrl).toContain('sanity.io');
    expect(result.mainImageAlt).toBe('Alt text');
    expect(result.featured).toBe(false);
  });

  it('maps the author sub-object', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.author).toEqual({
      id: 'author-1',
      name: 'Jane Doe',
      slug: 'jane-doe',
      imageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('maps categories array', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.categories).toEqual([
      { id: 'cat-1', title: 'Engineering', slug: 'engineering' },
    ]);
  });

  it('returns undefined author when author is absent at runtime', () => {
    const raw = {
      ...makeRawPostCard(),
      author: null,
    } as unknown as Parameters<typeof toPostCard>[0];
    expect(toPostCard(raw).author).toBeUndefined();
  });

  it('returns empty categories array when categories is absent at runtime', () => {
    const raw = {
      ...makeRawPostCard(),
      categories: null,
    } as unknown as Parameters<typeof toPostCard>[0];
    expect(toPostCard(raw).categories).toEqual([]);
  });

  it('defaults featured to false when null', () => {
    const result = toPostCard(makeRawPostCard({ featured: null }));
    expect(result.featured).toBe(false);
  });
});
