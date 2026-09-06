import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { contentModuleQuery } from './query';

describe('contentModuleQuery', () => {
  it('parses a body containing only a text block', () => {
    const raw = makeRawContentModule();

    expect(() => contentModuleQuery.parse(raw)).not.toThrow();
  });

  it('resolves a bodyImage block, deref-ing its asset and keeping layout', () => {
    const raw = makeRawContentModule({
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
          layout: 'FULL_BLEED',
        },
      ],
    });

    const parsed = contentModuleQuery.parse(raw);

    expect(parsed.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FULL_BLEED',
      asset: { _id: 'image-abc123-800x600-jpg' },
    });
  });

  // A bodyImage block's asset is `.nullable(true)`, not `.notNull()` — an
  // image never selected (or pointing at a deleted asset) must not throw the
  // whole query; `layout` survives regardless.
  it('allows a bodyImage body block with no asset selected and no layout', () => {
    const raw = makeRawContentModule({
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

    expect(() => contentModuleQuery.parse(raw)).not.toThrow();
    expect(contentModuleQuery.parse(raw).body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: null,
      asset: null,
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

    const parsed = contentModuleQuery.parse({
      brandVariant: 'PRIMARY',
      body: [richBlock],
      layout: null,
    });

    expect(parsed.body[0]).toEqual(richBlock);
  });

  it('keeps a rich code block intact alongside a resolved bodyImage block', () => {
    const codeBlock = {
      _type: 'code',
      _key: 'code-1',
      language: 'ts',
      filename: 'file.ts',
      code: 'const x = 1;',
      highlightedLines: [1],
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
      layout: 'FULL_BLEED',
    };

    const parsed = contentModuleQuery.parse({
      brandVariant: 'PRIMARY',
      body: [codeBlock, bodyImageBlock],
      layout: null,
    });

    expect(parsed.body[0]).toEqual(codeBlock);
    expect(parsed.body[1]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FULL_BLEED',
      asset: { _id: 'image-abc123-800x600-jpg' },
    });
  });
});
