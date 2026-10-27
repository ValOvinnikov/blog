import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  HEADING_TEXT_PATH,
  MOCK_TEMPLATE_REFERENCE,
  mockIndexPageDocument,
  mockRawBlogPage,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockTemplatedPageDocument,
  mockTemplateLayoutDocuments,
} from '@blog/service/testing/pages/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { blogPageQuery } from './query';

faker.seed(6023);

describe('blogPageQuery', () => {
  it.each([
    ['with no modules set', mockRawBlogPage({ modules: null })],
    ['with its hero slot set', mockRawBlogPage({ hero: mockRawHeroRef() })],
  ])('parses a blog page %s', (_, raw) => {
    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['heading block', { ...mockRawBlogPage(), headingBlock: null }],
    ['authored SEO', { ...mockRawBlogPage(), seo: null }],
  ])('rejects a blog page with no %s', (_, raw) => {
    expect(() => blogPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching blog page', () => {
    expect(blogPageQuery.parse(null)).toBeNull();
  });
});

describe('blogPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_postIndex' });

  it('resolves the hero and modules of the referenced template', async () => {
    const result = await evaluateGroqInLocale(blogPageQuery.query, [
      mockTemplatedPageDocument({
        _type: 'page_postIndex',
        template: templateRef,
      }),
      ...dataset,
    ]);

    expect(result).toHaveProperty('hero', mockRawHeroRef());
    expect(result).toHaveProperty('modules', [mockRawPostLatestRef()]);
  });

  it('resolves no hero and no modules without a template', async () => {
    const result = await evaluateGroqInLocale(blogPageQuery.query, [
      mockTemplatedPageDocument({ _type: 'page_postIndex' }),
      ...dataset,
    ]);

    expect(result).toHaveProperty('hero', null);
    expect(result).toHaveProperty('modules', null);
  });
});

describe('blogPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;
  const MOCK_EN_HEADING = faker.lorem.words(2);
  const MOCK_NL_HEADING = faker.lorem.words(2);

  const dataset = [
    mockIndexPageDocument({
      _type: 'page_postIndex',
      heading: MOCK_EN_HEADING,
      language: EN,
    }),
    mockIndexPageDocument({
      _type: 'page_postIndex',
      heading: MOCK_NL_HEADING,
      language: NL,
    }),
  ];

  it.each([
    [EN, MOCK_EN_HEADING],
    [NL, MOCK_NL_HEADING],
  ])(
    'resolves the %s blog page for its own language',
    async (locale, heading) => {
      expect(
        await evaluateGroqInLocale(blogPageQuery.query, dataset, locale),
      ).toHaveProperty(HEADING_TEXT_PATH, heading);
    },
  );

  it('resolves nothing for a language without a blog page', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, dataset, FR),
    ).toBeNull();
  });

  it('resolves a blog page with no language for the default language only', async () => {
    const legacy = [
      mockIndexPageDocument({
        _type: 'page_postIndex',
        heading: MOCK_EN_HEADING,
      }),
    ];

    expect(
      await evaluateGroqInLocale(blogPageQuery.query, legacy, EN),
    ).toHaveProperty(HEADING_TEXT_PATH, MOCK_EN_HEADING);
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, legacy, NL),
    ).toBeNull();
  });

  it('lists the language of every blog page as its translations', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, dataset, NL),
    ).toHaveProperty('translations', [{ language: EN }, { language: NL }]);
  });
});
