import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TEMPLATE_REFERENCE,
  mockIndexPageDocument,
  mockRawBlogPage,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';

import { blogPageQuery } from './query';

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

  it('parses null as no matching page_postIndex document, rather than throwing', () => {
    expect(blogPageQuery.parse(null)).toBeNull();
  });
});

describe('blogPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_postIndex' });

  it('resolves the hero and modules of the template the blog page references', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, [
        mockTemplatedPageDocument({
          _type: 'page_postIndex',
          template: templateRef,
        }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: mockRawHeroRef(),
      modules: [mockRawPostLatestRef()],
    });
  });

  it('resolves no hero and no modules for a blog page without a template', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, [
        mockTemplatedPageDocument({ _type: 'page_postIndex' }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('blogPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;
  const EN_HEADING = 'Blog';
  const NL_HEADING = 'Blog NL';

  const dataset = [
    mockIndexPageDocument({
      _type: 'page_postIndex',
      heading: EN_HEADING,
      language: EN,
    }),
    mockIndexPageDocument({
      _type: 'page_postIndex',
      heading: NL_HEADING,
      language: NL,
    }),
  ];

  it.each([
    [EN, EN_HEADING],
    [NL, NL_HEADING],
  ])(
    'resolves the %s blog page for its own language',
    async (locale, heading) => {
      expect(
        await evaluateGroqInLocale(blogPageQuery.query, dataset, locale),
      ).toMatchObject({
        headingBlock: { heading },
      });
    },
  );

  it('resolves nothing for a language without a blog page', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, dataset, FR),
    ).toBeNull();
  });

  it('resolves a blog page with no language for the default language only', async () => {
    const legacy = [
      mockIndexPageDocument({ _type: 'page_postIndex', heading: EN_HEADING }),
    ];

    expect(
      await evaluateGroqInLocale(blogPageQuery.query, legacy, EN),
    ).toMatchObject({
      headingBlock: { heading: EN_HEADING },
    });
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, legacy, NL),
    ).toBeNull();
  });

  it('lists the language of every blog page as its translations', async () => {
    expect(
      await evaluateGroqInLocale(blogPageQuery.query, dataset, NL),
    ).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
