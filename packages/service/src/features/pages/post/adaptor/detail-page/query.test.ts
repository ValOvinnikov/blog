import { makeRawTopic } from '@blog/service/testing/entities/fixtures';
import {
  makeRawAuthor,
  makeRawPostDetail,
  makeRawPostPage,
} from '@blog/service/testing/pages/fixtures';

import { postPageQuery } from './query';

describe('postPageQuery', () => {
  it('filters to page_post documents by their own slug', () => {
    expect(postPageQuery.query).toContain('_type == "page_post"');
    expect(postPageQuery.query).toContain('slug.current == $slug');
  });

  it('excludes page_post documents whose publishedAt is in the future, hard-404ing direct access', () => {
    expect(postPageQuery.query).toContain('publishedAt <= now()');
  });

  it('parses a post page whose optional fields are all absent', () => {
    const raw = makeRawPostPage({
      seo: null,
      post: makeRawPostDetail({
        heroImage: null,
        heroImageAsset: null,
        featured: null,
        seo: null,
        author: makeRawAuthor({ role: null }),
        topic: makeRawTopic({ description: null }),
      }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
  });

  it('resolves a bodyImage block, deref-ing its asset and keeping layout', () => {
    const raw = makeRawPostPage({
      post: makeRawPostDetail({
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
      }),
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.post.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FLOAT_LEFT',
      asset: { _id: 'image-abc123-800x600-jpg' },
    });
  });

  it('parses null as no matching page_post document, rather than throwing', () => {
    expect(postPageQuery.parse(null)).toBeNull();
  });

  // A bodyImage block's asset is `.nullable(true)`, not `.notNull()` — an
  // image never selected (or pointing at a deleted asset) must not throw the
  // whole query; `layout` survives regardless.
  it('allows a bodyImage body block with no asset selected and no layout', () => {
    const raw = makeRawPostPage({
      post: makeRawPostDetail({
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
      }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.post.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: null,
      asset: null,
    });
  });
});
