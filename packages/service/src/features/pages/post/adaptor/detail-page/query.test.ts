import {
  ASIDE_KIND,
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/transformer';
import { mockRawTopic } from '@blog/service/testing/entities/fixtures';
import {
  mockRawAuthor,
  mockRawPostDetail,
  mockSlugPageDocument,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_TITLE,
  mockRawBodyImageBlock,
  mockRawExternalLinkDocument,
  mockRawHeadingBlock,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTranslationLink } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { postPageQuery } from './query';

faker.seed(6016);

const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_SCHEDULED_SLUG = faker.lorem.slug();
const MOCK_EN_ID = faker.string.uuid();
const MOCK_NL_ID = faker.string.uuid();
const MOCK_SCHEDULED_ID = faker.string.uuid();
const MOCK_METADATA_ID = faker.string.uuid();
const MOCK_RICH_BLOCK_KEY = faker.string.uuid();
const MOCK_LINK_MARK_KEY = faker.string.uuid();
const MOCK_SPAN_KEY = faker.string.uuid();
const MOCK_SPAN_TEXT = faker.lorem.words(2);
const MOCK_ASIDE_KEY = faker.string.uuid();
const MOCK_ASIDE_BLOCK_KEY = faker.string.uuid();
const MOCK_ASIDE_SPAN_KEY = faker.string.uuid();
const MOCK_ASIDE_TEXT = faker.lorem.sentence();
const MOCK_PUBLISHED_AT = '2026-01-01T00:00:00Z';
const MOCK_SCHEDULED_AT = '2999-01-01T00:00:00Z';
const MODULE_REFS: TRawPostDetail['modules'] = [
  { _id: faker.string.uuid(), _type: 'module_postRelated' },
];

function parseBody(body: unknown[]) {
  const raw = mockRawPostDetail({ body: body as TRawPostDetail['body'] });

  return postPageQuery.parse(raw)?.body;
}

describe('postPageQuery', () => {
  it('parses a post whose optional fields are all absent', () => {
    const raw = mockRawPostDetail({
      heroImage: null,
      featured: null,
      author: mockRawAuthor({ role: null }),
      topic: mockRawTopic({ description: null }),
    });

    expect(() => postPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { seo: null }],
    ['heading block', { headingBlock: null }],
    ['an author', { author: null }],
    ['a topic', { topic: null }],
    ['any content', { body: null }],
  ])('throws when a post has no %s', (_, unset) => {
    const raw = { ...mockRawPostDetail(), ...unset };

    expect(() => postPageQuery.parse(raw)).toThrow();
  });

  it('parses a post whose author has no image', () => {
    const raw = mockRawPostDetail({
      author: mockRawAuthor({ image: null }),
    });

    expect(postPageQuery.parse(raw)?.author?.image).toBeNull();
  });

  it.each([
    ['a resolved bodyImage block, keeping layout', mockRawBodyImageBlock()],
    [
      'a bodyImage block with no asset selected and no layout',
      mockRawBodyImageBlock({ asset: null, layout: null }),
    ],
    [
      'a bodyImage block with no alt text',
      mockRawBodyImageBlock({ alt: null }),
    ],
  ])('keeps %s', (_, block) => {
    expect(parseBody([block])).toEqual([block]);
  });

  it('parses null as no matching post', () => {
    expect(postPageQuery.parse(null)).toBeNull();
  });

  it.each([
    ['no page-builder modules', null],
    ['page-builder modules set', MODULE_REFS],
  ])('parses a post with %s', (_, modules) => {
    const raw = mockRawPostDetail({ modules });

    expect(postPageQuery.parse(raw)?.modules).toEqual(modules);
  });

  it('parses a post whose heading has no supportingText', () => {
    const raw = mockRawPostDetail({
      headingBlock: mockRawHeadingBlock(MOCK_POST_TITLE),
    });

    const parsed = postPageQuery.parse(raw);

    expect(parsed?.headingBlock?.supportingText).toBeNull();
  });

  it('keeps every field of a rich text block intact', () => {
    const richBlock = {
      _type: 'block',
      _key: MOCK_RICH_BLOCK_KEY,
      style: 'h2',
      listItem: 'bullet',
      level: 1,
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: MOCK_LINK_MARK_KEY,
          link: mockRawExternalLinkDocument(),
        },
      ],
      children: [
        {
          _type: 'span',
          _key: MOCK_SPAN_KEY,
          text: MOCK_SPAN_TEXT,
          marks: ['strong'],
        },
      ],
    };

    expect(parseBody([richBlock])).toEqual([richBlock]);
  });

  it('keeps a rich aside block intact alongside a bodyImage block', () => {
    const asideBlock = {
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      _key: MOCK_ASIDE_KEY,
      kind: ASIDE_KIND.WHY_NOT,
      body: [
        {
          _type: 'block',
          _key: MOCK_ASIDE_BLOCK_KEY,
          style: 'normal',
          children: [
            { _type: 'span', _key: MOCK_ASIDE_SPAN_KEY, text: MOCK_ASIDE_TEXT },
          ],
          markDefs: null,
        },
      ],
    };
    const bodyImageBlock = mockRawBodyImageBlock();

    expect(parseBody([asideBlock, bodyImageBlock])).toEqual([
      asideBlock,
      bodyImageBlock,
    ]);
  });
});

describe('postPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  const dataset = [
    mockSlugPageDocument({
      _id: MOCK_EN_ID,
      _type: 'page_post',
      slug: MOCK_EN_SLUG,
      language: EN,
      publishedAt: MOCK_PUBLISHED_AT,
    }),
    mockSlugPageDocument({
      _id: MOCK_NL_ID,
      _type: 'page_post',
      slug: MOCK_NL_SLUG,
      language: NL,
      publishedAt: MOCK_PUBLISHED_AT,
    }),
    mockSlugPageDocument({
      _id: MOCK_SCHEDULED_ID,
      _type: 'page_post',
      slug: MOCK_SCHEDULED_SLUG,
      language: NL,
      publishedAt: MOCK_SCHEDULED_AT,
    }),
    {
      _id: MOCK_METADATA_ID,
      _type: 'translation.metadata',
      translations: [
        mockTranslationLink(EN, MOCK_EN_ID),
        mockTranslationLink(NL, MOCK_NL_ID),
      ],
    },
  ];

  function run(slug: string, locale: string): Promise<unknown> {
    return evaluateGroqExpression(postPageQuery.query, dataset, null, {
      slug,
      locale,
      defaultLocale: EN,
    });
  }

  it('resolves a slug only in the language the post is authored in', async () => {
    expect(await run(MOCK_NL_SLUG, NL)).toHaveProperty('_id', MOCK_NL_ID);
    expect(await run(MOCK_NL_SLUG, EN)).toBeNull();
    expect(await run(MOCK_EN_SLUG, FR)).toBeNull();
  });

  it('resolves nothing for a scheduled post', async () => {
    expect(await run(MOCK_SCHEDULED_SLUG, NL)).toBeNull();
  });

  it('returns the linked translations with their languages and slugs', async () => {
    expect(await run(MOCK_NL_SLUG, NL)).toHaveProperty('translations', [
      { language: EN, slug: MOCK_EN_SLUG },
      { language: NL, slug: MOCK_NL_SLUG },
    ]);
  });
});
