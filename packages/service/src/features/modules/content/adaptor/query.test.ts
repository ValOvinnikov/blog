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
import { faker } from '@faker-js/faker';

import { contentModuleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

faker.seed(11);

const MOCK_CONTENT_DOCUMENT = {
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
    [MOCK_CONTENT_DOCUMENT],
    undefined,
    { id: MOCK_CONTENT_MODULE_ID, locale, defaultLocale: EN },
  );

  return contentModuleQuery.parse(raw);
}

describe('contentModuleQuery', () => {
  it('resolves the body in the requested language', async () => {
    const { body } = await runContent(NL);

    expect(body).toEqual(mockParagraphBlocks(MOCK_DUTCH_TEXT));
  });

  it.each([
    ['no asset selected and no layout', { asset: null, layout: null }],
    ['no alt text', { alt: null }],
  ])('allows a body image block with %s', (_, overrides) => {
    const block = mockRawBodyImageBlock(overrides);
    const raw = mockRawContentModule({ body: [block] });

    const { body } = contentModuleQuery.parse(raw);

    expect(body).toEqual([block]);
  });

  it('keeps every field of a rich text block', () => {
    const richBlock = {
      _type: 'block',
      _key: faker.string.uuid(),
      style: 'h2',
      listItem: 'bullet',
      level: 1,
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: faker.string.uuid(),
          link: mockRawExternalLinkDocument(),
        },
      ],
      children: [
        {
          _type: 'span',
          _key: faker.string.uuid(),
          text: faker.lorem.word(),
          marks: ['strong'],
        },
      ],
    };

    const parsed = contentModuleQuery.parse({
      ...mockRawContentModule(),
      body: [richBlock],
    });

    expect(parsed.body[0]).toEqual(richBlock);
  });

  it('keeps a code block alongside a resolved body image block', () => {
    const codeBlock = {
      _type: 'code',
      _key: faker.string.uuid(),
      language: 'ts',
      filename: faker.system.commonFileName('ts'),
      code: faker.lorem.sentence(),
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
