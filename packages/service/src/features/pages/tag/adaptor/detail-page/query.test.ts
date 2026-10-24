import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_TITLE,
  MOCK_TOPIC_SLUG,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_TEMPLATE_REFERENCE,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTagPage,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTranslationLink } from '@blog/service/testing/shared/localized';

import { tagPageQuery } from './query';

describe('tagPageQuery', () => {
  it.each([
    ['with no modules', mockRawTagPage({ modules: null })],
    [
      'with a list module alongside other modules, and SEO',
      mockRawTagPage({
        modules: [
          { _id: 'post-list-1', _type: 'module_postList' },
          mockRawCtaRef(),
        ],
        seo: {
          metaTitle: MOCK_TAG_TITLE,
          metaDescription: null,
          openGraph: null,
        },
      }),
    ],
    ['with its hero slot set', mockRawTagPage({ hero: mockRawHeroRef() })],
    [
      'with an authored headingBlock',
      mockRawTagPage({ headingBlock: mockRawHeadingBlock(MOCK_TAG_TITLE) }),
    ],
  ])('parses a tag page %s', (_, raw) => {
    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawTagPage(), seo: null }],
    ['heading block', { ...mockRawTagPage(), headingBlock: null }],
  ])('rejects a tag page with no %s', (_, raw) => {
    expect(() => tagPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_tag document, rather than throwing', () => {
    expect(tagPageQuery.parse(null)).toBeNull();
  });
});

describe('tagPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const templatedPageFields = {
    slug: { current: MOCK_TOPIC_SLUG },
    language: LOCALE_ISO_CODES.EN,
  };
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_tag' });

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(tagPageQuery.query, data, null, {
      slug: MOCK_TOPIC_SLUG,
      locale: LOCALE_ISO_CODES.EN,
    });
  }

  it('resolves the hero and modules of the template the tag page references', async () => {
    expect(
      await run([
        mockTemplatedPageDocument({
          _type: 'page_tag',
          template: templateRef,
          ...templatedPageFields,
        }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: mockRawHeroRef(),
      modules: [mockRawPostLatestRef()],
    });
  });

  it('resolves no hero and no modules for a tag page without a template', async () => {
    expect(
      await run([
        mockTemplatedPageDocument({
          _type: 'page_tag',
          ...templatedPageFields,
        }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('tagPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function page(id: string, heading: string, language: string) {
    return {
      _id: id,
      _type: 'page_tag',
      slug: { current: 'design' },
      headingBlock: { heading },
      language,
    };
  }

  const dataset = [
    page('design-en', 'Design', EN),
    page('design-nl', 'Ontwerp', NL),
    {
      _id: 'meta-design',
      _type: 'translation.metadata',
      translations: [
        mockTranslationLink(EN, 'design-en'),
        mockTranslationLink(NL, 'design-nl'),
      ],
    },
  ];

  function run(locale: string): Promise<unknown> {
    return evaluateGroqExpression(tagPageQuery.query, dataset, null, {
      slug: 'design',
      locale,
      defaultLocale: EN,
    });
  }

  it('resolves the same slug to a different page per language', async () => {
    expect(await run(EN)).toMatchObject({
      headingBlock: { heading: 'Design' },
    });
    expect(await run(NL)).toMatchObject({
      headingBlock: { heading: 'Ontwerp' },
    });
  });

  it('resolves nothing for a language the page is not authored in', async () => {
    expect(await run(FR)).toBeNull();
  });

  it('returns the linked translations with their languages and slugs', async () => {
    expect(await run(NL)).toMatchObject({
      translations: [
        { language: EN, slug: 'design' },
        { language: NL, slug: 'design' },
      ],
    });
  });
});
