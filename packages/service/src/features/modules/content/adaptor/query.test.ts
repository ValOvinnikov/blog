import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { contentModuleQuery } from './query';

describe('contentModuleQuery', () => {
  it('parses a body containing only a text block', () => {
    const raw = makeRawContentModule();

    expect(() => contentModuleQuery.parse(raw)).not.toThrow();
  });

  // `body` is projected as a raw `sub.field('body[]').notNull()` array (no
  // per-item `.project()`), so a `bodyImage` block's optional `layout` field
  // must survive groqd's runtime `.parse()` unchanged — this locks that in
  // against a future narrowing that would silently strip it.
  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: undefined,
          media: undefined,
          hotspot: undefined,
          crop: undefined,
          alt: 'A diagram',
          layout: 'FULL_BLEED',
        },
      ],
    });

    const parsed = contentModuleQuery.parse(raw);

    expect(parsed.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FULL_BLEED',
    });
  });

  it('allows a bodyImage body block with no layout', () => {
    const raw = makeRawContentModule({
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

    expect(() => contentModuleQuery.parse(raw)).not.toThrow();
    expect(contentModuleQuery.parse(raw).body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: undefined,
    });
  });
});
