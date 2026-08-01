import {
  makeRawAuthor,
  makeRawCategory,
} from '@blog/service/testing/entities/fixtures';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';

import { postDetailQuery } from './query';

describe('postDetailQuery', () => {
  it('parses a post whose optional fields are all absent', () => {
    const raw = makeRawPostDetail({
      heroImage: null,
      heroImageAsset: null,
      featured: null,
      seo: null,
      author: makeRawAuthor({ role: null }),
      category: makeRawCategory({ description: null }),
    });

    expect(() => postDetailQuery.parse(raw)).not.toThrow();
  });

  it('excludes posts whose publishedAt is in the future, hard-404ing direct access', () => {
    expect(postDetailQuery.query).toContain('publishedAt <= now()');
  });

  // `body` is projected as a raw `sub.field('body[]').notNull()` array (no
  // per-item `.project()`), so a `bodyImage` block's optional `layout` field
  // must survive groqd's runtime `.parse()` unchanged — this locks that in
  // against a future narrowing that would silently strip it.
  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawPostDetail({
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
    });

    const parsed = postDetailQuery.parse(raw);

    expect(parsed?.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FLOAT_LEFT',
    });
  });

  it('allows a bodyImage body block with no layout', () => {
    const raw = makeRawPostDetail({
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
    });

    expect(() => postDetailQuery.parse(raw)).not.toThrow();
    expect(postDetailQuery.parse(raw)?.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: undefined,
    });
  });
});
