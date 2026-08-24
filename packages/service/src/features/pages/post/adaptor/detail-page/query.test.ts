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

  // `body` is projected as a raw `sub.field('body[]').notNull()` array (no
  // per-item `.project()`), so a `bodyImage` block's optional `layout` field
  // must survive groqd's runtime `.parse()` unchanged — this locks that in
  // against a future narrowing that would silently strip it.
  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawPostPage({
      post: makeRawPostDetail({
        body: [
          {
            _type: 'bodyImage',
            _key: 'image-1',
            asset: undefined,
            media: undefined,
            hotspot: undefined,
            crop: undefined,
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
    });
  });

  it('allows a bodyImage body block with no layout', () => {
    const raw = makeRawPostPage({
      post: makeRawPostDetail({
        body: [
          {
            _type: 'bodyImage',
            _key: 'image-1',
            asset: undefined,
            media: undefined,
            hotspot: undefined,
            crop: undefined,
            alt: 'A diagram',
            layout: undefined,
          },
        ],
      }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
    expect(postPageQuery.parse(raw)?.post.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: undefined,
    });
  });
});
