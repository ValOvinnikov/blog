import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toPostCard } from './to-post-card';

describe('toPostCard', () => {
  it('maps all fields from raw input', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.id).toBe('post-1');
    expect(result.title).toBe('Hello World');
    expect(result.slug).toBe('hello-world');
    expect(result.excerpt).toBe('A sufficiently long excerpt for the card.');
    expect(result.publishedAt).toBe('2026-01-15T00:00:00Z');
    expect(result.heroImage).toEqual(
      expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    );
    expect(result.featured).toBe(false);
    expect(result.readingTimeMinutes).toBe(2);
  });

  it('computes reading time from the word count', () => {
    const result = toPostCard(makeRawPostCard({ wordCount: 600 }));
    expect(result.readingTimeMinutes).toBe(3);
  });

  it('maps the author sub-object', () => {
    const result = toPostCard(
      makeRawPostCard({
        author: {
          _id: 'author-1',
          name: 'Jane Doe',
          image: makeRawSanityImage('Jane avatar'),
          profilePage: { slug: 'jane-doe' },
        },
      }),
    );

    expect(result.author).toEqual({
      id: 'author-1',
      name: 'Jane Doe',
      profilePageSlug: 'jane-doe',
      image: expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    });
  });

  it('maps an author with no image to an undefined image', () => {
    const result = toPostCard(
      makeRawPostCard({
        author: {
          _id: 'author-1',
          name: 'Jane Doe',
          image: null,
          profilePage: null,
        },
      }),
    );

    expect(result.author.image).toBeUndefined();
  });

  it('maps a missing profilePage reference to an undefined profilePageSlug', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.author.profilePageSlug).toBeUndefined();
  });

  it('maps the topic', () => {
    const result = toPostCard(makeRawPostCard());

    expect(result.topic).toEqual({
      id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
    });
  });

  it('maps a sparse post-card with no excerpt to undefined', () => {
    const result = toPostCard(
      makeRawPostCard({
        headingBlock: makeRawHeadingBlock('Hello World'),
      }),
    );

    expect(result.excerpt).toBeUndefined();
  });

  it('defaults featured to false when null', () => {
    const result = toPostCard(makeRawPostCard({ featured: null }));
    expect(result.featured).toBe(false);
  });

  it('returns an undefined heroImage when heroImage is absent', () => {
    const result = toPostCard(makeRawPostCard({ heroImage: null }));

    expect(result.heroImage).toBeUndefined();
  });
});
