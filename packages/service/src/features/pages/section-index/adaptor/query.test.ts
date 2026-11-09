import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  HEADING_TEXT_PATH,
  MOCK_TEMPLATE_REFERENCE,
  mockIndexPageDocument,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawSectionIndexPage,
  mockTemplatedPageDocument,
  mockTemplateLayoutDocuments,
} from '@blog/service/testing/pages/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { sectionIndexPageQuery } from './query';
import type { TSectionIndexType } from './types';

faker.seed(65151);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(3);
const MOCK_OTHER_HUB_HEADING = faker.lorem.words(4);

describe(sectionIndexPageQuery, () => {
  it('parses a hub with no hero or modules', () => {
    const raw = mockRawSectionIndexPage({ hero: null, modules: null });

    expect(() =>
      sectionIndexPageQuery('page_privacyIndex').parse(raw),
    ).not.toThrow();
  });

  it.each([
    ['heading block', { ...mockRawSectionIndexPage(), headingBlock: null }],
    ['authored SEO', { ...mockRawSectionIndexPage(), seo: null }],
  ])('rejects a hub with no %s', (_, raw) => {
    expect(() => sectionIndexPageQuery('page_legalIndex').parse(raw)).toThrow();
  });

  it('parses null as no hub', () => {
    expect(sectionIndexPageQuery('page_legalIndex').parse(null)).toBeNull();
  });

  describe.each<[TSectionIndexType, TSectionIndexType, string]>([
    ['page_privacyIndex', 'page_legalIndex', 'template_privacyIndex'],
    ['page_legalIndex', 'page_privacyIndex', 'template_legalIndex'],
  ])('%s', (type, otherType, templateType) => {
    const query = sectionIndexPageQuery(type).query;
    const dataset = [
      mockIndexPageDocument({
        _type: type,
        heading: MOCK_EN_HEADING,
        language: EN,
      }),
      mockIndexPageDocument({
        _type: type,
        heading: MOCK_NL_HEADING,
        language: NL,
      }),
      mockIndexPageDocument({
        _type: otherType,
        heading: MOCK_OTHER_HUB_HEADING,
        language: FR,
      }),
    ];

    it.each([
      [EN, MOCK_EN_HEADING],
      [NL, MOCK_NL_HEADING],
    ])('loads the %s hub', async (locale, heading) => {
      const result = await evaluateGroqInLocale(query, dataset, locale);

      expect(result).toHaveProperty(HEADING_TEXT_PATH, heading);
    });

    it('resolves nothing in a language with only the other hub', async () => {
      expect(await evaluateGroqInLocale(query, dataset, FR)).toBeNull();
    });

    it('lists every language the hub exists in', async () => {
      const result = await evaluateGroqInLocale(query, dataset, NL);

      expect(result).toHaveProperty('translations', [
        { language: EN },
        { language: NL },
      ]);
    });

    it("resolves its template's hero and modules in order", async () => {
      const page = mockTemplatedPageDocument({
        _type: type,
        language: EN,
        template: MOCK_TEMPLATE_REFERENCE,
      });

      const result = await evaluateGroqInLocale(
        query,
        [page, ...mockTemplateLayoutDocuments({ _type: templateType })],
        EN,
      );

      expect(result).toHaveProperty('hero', mockRawHeroRef());
      expect(result).toHaveProperty('modules', [mockRawPostLatestRef()]);
    });
  });
});
