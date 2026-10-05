import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';
import { makeRawExternalLinkDocument } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import { contentModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const contentDocument = {
  _id: 'content-1',
  _type: 'module_content',
  brandVariant: 'PRIMARY',
  body: localizedValues('internationalizedArrayArticleTextValue', {
    [EN]: paragraphBlocks('Read on.'),
    [NL]: paragraphBlocks('Lees verder.'),
  }),
};

async function runContent(locale: string) {
  const raw = await evaluateGroqExpression(
    contentModuleQuery.query,
    [contentDocument],
    undefined,
    { id: 'content-1', locale, defaultLocale: EN },
  );

  return contentModuleQuery.parse(raw);
}

describe('contentModuleQuery', () => {
  it('resolves the body in the requested language', async () => {
    expect((await runContent(NL)).body).toMatchObject([
      { children: [{ text: 'Lees verder.' }] },
    ]);
  });

  it('falls back to the default-language body', async () => {
    expect((await runContent(FR)).body).toMatchObject([
      { children: [{ text: 'Read on.' }] },
    ]);
  });

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

  it('allows a bodyImage body block with no alt text', () => {
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
          alt: null,
          layout: 'FULL_BLEED',
        },
      ],
    });

    expect(() => contentModuleQuery.parse(raw)).not.toThrow();
    expect(contentModuleQuery.parse(raw).body[0]).toMatchObject({
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
        {
          _type: 'linkRef',
          _key: 'link-1',
          link: makeRawExternalLinkDocument(),
        },
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
