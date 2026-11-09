import { LEGAL_PAGE_KIND, LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockSlugPageDocument } from '@blog/service/testing/pages/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { sectionDocumentByKindQuery } from './query';

faker.seed(6516);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_POLICY_SLUG = faker.lorem.slug();
const MOCK_TERMS_SLUG = faker.lorem.slug();
const MOCK_OTHER_SLUG = faker.lorem.slug();

const dataset = [
  mockSlugPageDocument({
    _type: 'page_privacyDocument',
    slug: MOCK_POLICY_SLUG,
    language: NL,
    kind: LEGAL_PAGE_KIND.PRIVACY_POLICY,
  }),
  mockSlugPageDocument({
    _type: 'page_legalDocument',
    slug: MOCK_TERMS_SLUG,
    language: NL,
    kind: LEGAL_PAGE_KIND.TERMS,
  }),
  mockSlugPageDocument({
    _type: 'page_legalDocument',
    slug: MOCK_OTHER_SLUG,
    language: NL,
    kind: LEGAL_PAGE_KIND.OTHER,
  }),
  { _type: 'page_cookieStatement', language: NL },
];

function run(kind: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    sectionDocumentByKindQuery.query,
    dataset,
    null,
    { kind, locale, defaultLocale: EN },
  );
}

describe('sectionDocumentByKindQuery', () => {
  it.each([
    [LEGAL_PAGE_KIND.PRIVACY_POLICY, 'page_privacyDocument', MOCK_POLICY_SLUG],
    [LEGAL_PAGE_KIND.TERMS, 'page_legalDocument', MOCK_TERMS_SLUG],
  ])(
    'finds the %s page in the language asked for',
    async (kind, _type, slug) => {
      expect(await run(kind, NL)).toEqual({ _type, slug });
    },
  );

  it('finds the cookie statement in the language asked for', async () => {
    expect(await run(LEGAL_PAGE_KIND.COOKIE_STATEMENT, NL)).toEqual({
      _type: 'page_cookieStatement',
      slug: null,
    });
  });

  it('finds nothing when no page of the kind exists in that language', async () => {
    expect(await run(LEGAL_PAGE_KIND.TERMS, EN)).toBeNull();
    expect(await run(LEGAL_PAGE_KIND.COOKIE_STATEMENT, EN)).toBeNull();
    expect(await run(LEGAL_PAGE_KIND.IMPRINT, NL)).toBeNull();
  });

  it('never finds an Other page by kind', async () => {
    expect(await run(LEGAL_PAGE_KIND.OTHER, NL)).toBeNull();
  });
});
