import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_TEMPLATE_REFERENCE,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTopicPage,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
} from '@blog/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockTranslationLink,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { topicPageQuery } from './query';

describe('topicPageQuery', () => {
  it.each([
    ['with no modules', mockRawTopicPage({ modules: null })],
    [
      'with a list module alongside other modules, and SEO',
      mockRawTopicPage({
        modules: [
          { _id: 'post-list-1', _type: 'module_postList' },
          mockRawCtaRef(),
        ],
        seo: {
          metaTitle: MOCK_TOPIC_TITLE,
          metaDescription: null,
          openGraph: null,
        },
      }),
    ],
    ['with its hero slot set', mockRawTopicPage({ hero: mockRawHeroRef() })],
    [
      'with an authored headingBlock',
      mockRawTopicPage({ headingBlock: mockRawHeadingBlock(MOCK_TOPIC_TITLE) }),
    ],
  ])('parses a topic page %s', (_, raw) => {
    expect(() => topicPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawTopicPage(), seo: null }],
    ['heading block', { ...mockRawTopicPage(), headingBlock: null }],
  ])('rejects a topic page with no %s', (_, raw) => {
    expect(() => topicPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_topic document, rather than throwing', () => {
    expect(topicPageQuery.parse(null)).toBeNull();
  });
});

describe('topicPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const templatedPageFields = {
    slug: { current: MOCK_TOPIC_SLUG },
    language: LOCALE_ISO_CODES.EN,
  };
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_topic' });

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(topicPageQuery.query, data, null, {
      slug: MOCK_TOPIC_SLUG,
      locale: LOCALE_ISO_CODES.EN,
    });
  }

  it('resolves the hero and modules of the template the topic page references', async () => {
    expect(
      await run([
        mockTemplatedPageDocument({
          _type: 'page_topic',
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

  it('resolves no hero and no modules for a topic page without a template', async () => {
    expect(
      await run([
        mockTemplatedPageDocument({
          _type: 'page_topic',
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

describe('topicPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function page(id: string, heading: string, language: string) {
    return {
      _id: id,
      _type: 'page_topic',
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
    return evaluateGroqExpression(topicPageQuery.query, dataset, null, {
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
