import { LEGAL_PAGE_KIND, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  mockRawSectionDocumentDetail,
  mockSlugPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { mockRawSeo } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { sectionDocumentPageQuery } from './query';

faker.seed(6513);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_SLUG = faker.lorem.slug();
const MOCK_PRIVACY_ID = faker.string.uuid();
const MOCK_LEGAL_ID = faker.string.uuid();

const dataset = [
  mockSlugPageDocument({
    _id: MOCK_PRIVACY_ID,
    _type: 'page_privacyDocument',
    slug: MOCK_SLUG,
    language: NL,
    title: faker.lorem.words(2),
    kind: LEGAL_PAGE_KIND.PRIVACY_POLICY,
    content: [],
    seo: mockRawSeo(),
  }),
  mockSlugPageDocument({
    _id: MOCK_LEGAL_ID,
    _type: 'page_legalDocument',
    slug: MOCK_SLUG,
    language: NL,
    title: faker.lorem.words(2),
    kind: LEGAL_PAGE_KIND.TERMS,
    content: [],
    seo: mockRawSeo(),
  }),
];

function run(type: string, slug: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(sectionDocumentPageQuery.query, dataset, null, {
    type,
    slug,
    locale,
    defaultLocale: EN,
  });
}

describe('sectionDocumentPageQuery', () => {
  it.each([
    ['page_privacyDocument', MOCK_PRIVACY_ID],
    ['page_legalDocument', MOCK_LEGAL_ID],
  ])('loads a %s by its section, slug and locale', async (type, id) => {
    expect(await run(type, MOCK_SLUG, NL)).toHaveProperty('_id', id);
  });

  it('resolves nothing in another language', async () => {
    expect(await run('page_privacyDocument', MOCK_SLUG, EN)).toBeNull();
  });

  it('resolves nothing for a slug no page carries', async () => {
    expect(await run('page_legalDocument', faker.lorem.slug(), NL)).toBeNull();
  });

  it('parses null as no matching page', () => {
    expect(sectionDocumentPageQuery.parse(null)).toBeNull();
  });

  it.each([['seo'], ['body'], ['kind']])(
    'throws when a page has no %s',
    (field) => {
      const raw = { ...mockRawSectionDocumentDetail(), [field]: null };

      expect(() => sectionDocumentPageQuery.parse(raw)).toThrow();
    },
  );
});
