import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/transformer';
import { makeRawTopic } from '@blog/service/testing/entities/fixtures';
import {
  makeRawAuthor,
  makeRawPostDetail,
} from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { postPageQuery } from './query';

describe('postPageQuery', () => {
  it('filters to page_post documents by their own slug', () => {
    expect(postPageQuery.query).toContain('_type == "page_post"');
    expect(postPageQuery.query).toContain('slug.current == $slug');
  });

  it('excludes page_post documents whose publishedAt is in the future, hard-404ing direct access', () => {
    expect(postPageQuery.query).toContain('publishedAt <= now()');
  });

  it('parses a post whose optional fields are all absent', () => {
    const raw = makeRawPostDetail({
      heroImage: null,
      featured: null,
      seo: null,
      author: makeRawAuthor({ role: null }),
      topic: makeRawTopic({ description: null }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a post whose author has no image', () => {
    const raw = makeRawPostDetail({
      author: makeRawAuthor({ image: null }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.author?.image).toBeNull();
  });

  it('resolves a bodyImage block, deref-ing its asset and keeping layout', () => {
    const raw = makeRawPostDetail({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: {
            _id: 'image-abc123-800x600-jpg',
            metadata: {
              lqip: null,
              dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
            },
          },
          hotspot: null,
          crop: null,
          alt: 'A diagram',
          layout: 'FLOAT_LEFT',
        },
      ],
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.body?.[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FLOAT_LEFT',
      asset: { _id: 'image-abc123-800x600-jpg' },
    });
  });

  it('parses null as no matching page_post document, rather than throwing', () => {
    expect(postPageQuery.parse(null)).toBeNull();
  });

  it('parses a post with no page-builder modules', () => {
    const raw = makeRawPostDetail({ modules: null });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.modules).toBeNull();
  });

  it('parses a post with page-builder modules set', () => {
    const raw = makeRawPostDetail({
      modules: [{ _id: 'related-1', _type: 'module_postRelated' }],
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.modules).toEqual([
      { _id: 'related-1', _type: 'module_postRelated' },
    ]);
  });

  it('parses a post whose only optional heading field, supportingText, is absent', () => {
    const raw = makeRawPostDetail({
      headingBlock: makeRawHeadingBlock('Hello World'),
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.headingBlock?.supportingText).toBeNull();
  });

  it('throws when a post has no headingBlock, relying on PUBLISHED_POST_FILTER to keep such a document out of this query', () => {
    const raw = { ...makeRawPostDetail(), headingBlock: null };

    expect(() => postPageQuery.parse(raw)).toThrow();
  });

  it('throws when a post has no author, relying on PUBLISHED_POST_FILTER to keep such a document out of this query', () => {
    const raw = { ...makeRawPostDetail(), author: null };

    expect(() => postPageQuery.parse(raw)).toThrow();
  });

  it('throws when a post has no topic, relying on PUBLISHED_POST_FILTER to keep such a document out of this query', () => {
    const raw = { ...makeRawPostDetail(), topic: null };

    expect(() => postPageQuery.parse(raw)).toThrow();
  });

  it('throws when a post has no content, relying on PUBLISHED_POST_FILTER to keep such a document out of this query', () => {
    const raw = { ...makeRawPostDetail(), body: null };

    expect(() => postPageQuery.parse(raw)).toThrow();
  });

  // A bodyImage block's asset is `.nullable(true)`, not `.notNull()` — an
  // image never selected (or pointing at a deleted asset) must not throw the
  // whole query; `layout` survives regardless.
  it('allows a bodyImage body block with no asset selected and no layout', () => {
    const raw = makeRawPostDetail({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: null,
          hotspot: null,
          crop: null,
          alt: 'A diagram',
          layout: null,
        },
      ],
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.body?.[0]).toMatchObject({
      _type: 'bodyImage',
      layout: null,
      asset: null,
    });
  });

  // `alt` is `.nullable(true)` — missing alt text must not 404 the post.
  it('allows a bodyImage body block with no alt text', () => {
    const raw = makeRawPostDetail({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: {
            _id: 'image-abc123-800x600-jpg',
            metadata: {
              lqip: null,
              dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
            },
          },
          hotspot: null,
          crop: null,
          alt: null,
          layout: 'FLOAT_LEFT',
        },
      ],
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.body?.[0]).toMatchObject({
      _type: 'bodyImage',
      alt: null,
    });
  });

  it('keeps every field of a rich text block intact', () => {
    const richBlock = {
      _type: 'block',
      _key: 'block-1',
      style: 'h2',
      listItem: 'bullet',
      level: 1,
      markDefs: [
        { _type: 'link', _key: 'link-1', href: 'https://example.com' },
      ],
      children: [
        { _type: 'span', _key: 'span-1', text: 'Hello', marks: ['strong'] },
      ],
    };
    const raw = makeRawPostDetail({
      body: [richBlock] as TRawPostDetail['body'],
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.body?.[0]).toEqual(richBlock);
  });

  it('keeps a rich aside block intact alongside a resolved bodyImage block', () => {
    const asideBlock = {
      _type: 'aside',
      _key: 'aside-1',
      kind: 'WHY_NOT',
      body: [
        {
          _type: 'block',
          _key: 'aside-block-1',
          style: 'normal',
          children: [{ _type: 'span', _key: 'aside-span-1', text: 'Because.' }],
        },
      ],
    };
    const bodyImageBlock = {
      _type: 'bodyImage',
      _key: 'image-1',
      asset: {
        _id: 'image-abc123-800x600-jpg',
        metadata: {
          lqip: null,
          dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
        },
      },
      hotspot: null,
      crop: null,
      alt: 'A diagram',
      layout: 'FLOAT_LEFT',
    };
    const raw = makeRawPostDetail({
      body: [asideBlock, bodyImageBlock] as TRawPostDetail['body'],
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.body?.[0]).toEqual(asideBlock);
    expect(parsed?.body?.[1]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FLOAT_LEFT',
      asset: { _id: 'image-abc123-800x600-jpg' },
    });
  });
});
