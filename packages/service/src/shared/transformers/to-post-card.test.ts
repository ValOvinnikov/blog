import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toPostCard } from './to-post-card';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/img-800x600.jpg',
  ),
}));

const tenant = makeTenant();

describe('toPostCard', () => {
  it('maps all fields from raw input', () => {
    const result = toPostCard(makeRawPostCard(), tenant);

    expect(result.id).toBe('post-1');
    expect(result.title).toBe('Hello World');
    expect(result.slug).toBe('hello-world');
    expect(result.excerpt).toBe('A sufficiently long excerpt for the card.');
    expect(result.publishedAt).toBe('2026-01-15T00:00:00Z');
    expect(result.heroImageUrl).toContain('sanity.io');
    expect(result.heroImageAlt).toBe('Alt text');
    expect(result.featured).toBe(false);
    expect(result.readingTimeMinutes).toBe(2);
  });

  it('computes reading time from the word count', () => {
    const result = toPostCard(makeRawPostCard({ wordCount: 600 }), tenant);
    expect(result.readingTimeMinutes).toBe(3);
  });

  it('maps the author sub-object', () => {
    const result = toPostCard(
      makeRawPostCard({
        author: {
          _id: 'author-1',
          name: 'Jane Doe',
          image: makeRawImage('Jane avatar'),
          profilePage: { slug: 'jane-doe' },
        },
      }),
      tenant,
    );

    expect(result.author).toEqual({
      id: 'author-1',
      name: 'Jane Doe',
      profilePageSlug: 'jane-doe',
      imageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('maps a missing profilePage reference to an undefined profilePageSlug', () => {
    const result = toPostCard(makeRawPostCard(), tenant);

    expect(result.author.profilePageSlug).toBeUndefined();
  });

  it('maps the topic', () => {
    const result = toPostCard(makeRawPostCard(), tenant);

    expect(result.topic).toEqual({
      id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
    });
  });

  it('defaults featured to false when null', () => {
    const result = toPostCard(makeRawPostCard({ featured: null }), tenant);
    expect(result.featured).toBe(false);
  });

  it('returns undefined image fields when heroImage is absent', () => {
    const result = toPostCard(
      makeRawPostCard({ heroImage: null, heroImageAsset: null }),
      tenant,
    );

    expect(result.heroImageUrl).toBeUndefined();
    expect(result.heroImageAlt).toBeUndefined();
    expect(result.heroImageSanity).toBeUndefined();
  });
});
