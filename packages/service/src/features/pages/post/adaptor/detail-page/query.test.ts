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
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_TITLE,
  mockRawBodyImageBlock,
  mockRawExternalLinkDocument,
  mockRawHeadingBlock,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTranslationLink } from '@blog/service/testing/shared/localized';

import { postPageQuery } from './query';

const EN_SLUG = 'my-article';
const NL_SLUG = 'mijn-artikel';
const EN_ID = 'article-en';
const NL_ID = 'article-nl';
const MODULE_REFS: TRawPostDetail['modules'] = [
  { _id: 'related-1', _type: 'module_postRelated' },
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

  it('parses null as no matching page_post document, rather than throwing', () => {
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

    expect(parseBody([richBlock])).toEqual([richBlock]);
  });

  it('keeps a rich aside block intact alongside a bodyImage block', () => {
    const asideBlock = {
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      _key: 'aside-1',
      kind: ASIDE_KIND.WHY_NOT,
      body: [
        {
          _type: 'block',
          _key: 'aside-block-1',
          style: 'normal',
          children: [{ _type: 'span', _key: 'aside-span-1', text: 'Because.' }],
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

  function post(
    id: string,
    slug: string,
    language: string,
    publishedAt = '2026-01-01T00:00:00Z',
  ) {
    return {
      _id: id,
      _type: 'page_post',
      slug: { current: slug },
      language,
      publishedAt,
    };
  }

  const dataset = [
    post(EN_ID, EN_SLUG, EN),
    post(NL_ID, NL_SLUG, NL),
    post('scheduled-nl', 'later', NL, '2999-01-01T00:00:00Z'),
    {
      _id: 'meta-article',
      _type: 'translation.metadata',
      translations: [
        mockTranslationLink(EN, EN_ID),
        mockTranslationLink(NL, NL_ID),
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
    expect(await run(NL_SLUG, NL)).toMatchObject({ _id: NL_ID });
    expect(await run(NL_SLUG, EN)).toBeNull();
    expect(await run(EN_SLUG, FR)).toBeNull();
  });

  it('hard-404s a scheduled post', async () => {
    expect(await run('later', NL)).toBeNull();
  });

  it('returns the linked translations with their languages and slugs', async () => {
    expect(await run(NL_SLUG, NL)).toMatchObject({
      translations: [
        { language: EN, slug: EN_SLUG },
        { language: NL, slug: NL_SLUG },
      ],
    });
  });
});
