import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_CONTENT_MODULE_ID,
  mockRawContentModule,
} from '@blog/service/testing/modules/fixtures';
import {
  mockRawBodyImageBlock,
  mockRawExternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  mockLocalizedValues,
  mockParagraphBlocks,
} from '@blog/service/testing/shared/localized';

import { contentModuleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

const contentDocument = {
  _id: MOCK_CONTENT_MODULE_ID,
  _type: 'module_content',
  brandVariant: BRAND_VARIANT.PRIMARY,
  body: mockLocalizedValues('internationalizedArrayArticleTextValue', {
    [EN]: mockParagraphBlocks(MOCK_ENGLISH_TEXT),
    [NL]: mockParagraphBlocks(MOCK_DUTCH_TEXT),
  }),
};

async function runContent(locale: string) {
  const raw = await evaluateGroqExpression(
    contentModuleQuery.query,
    [contentDocument],
    undefined,
    { id: MOCK_CONTENT_MODULE_ID, locale, defaultLocale: EN },
  );

  return contentModuleQuery.parse(raw);
}

describe('contentModuleQuery', () => {
  it('resolves the body in the requested language', async () => {
    expect((await runContent(NL)).body).toMatchObject([
      { children: [{ text: MOCK_DUTCH_TEXT }] },
    ]);
  });

  it.each([
    ['no asset selected and no layout', { asset: null, layout: null }],
    ['no alt text', { alt: null }],
  ])('allows a bodyImage body block with %s', (_, overrides) => {
    const raw = mockRawContentModule({
      body: [mockRawBodyImageBlock(overrides)],
    });

    expect(contentModuleQuery.parse(raw).body[0]).toMatchObject(overrides);
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
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: 'link-1',
          link: mockRawExternalLinkDocument(),
        },
      ],
      children: [
        { _type: 'span', _key: 'span-1', text: 'Hello', marks: ['strong'] },
      ],
    };

    const parsed = contentModuleQuery.parse({
      ...mockRawContentModule(),
      body: [richBlock],
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
    const bodyImageBlock = mockRawBodyImageBlock();

    const parsed = contentModuleQuery.parse({
      ...mockRawContentModule(),
      body: [codeBlock, bodyImageBlock],
    });

    expect(parsed.body).toEqual([codeBlock, bodyImageBlock]);
  });
});
