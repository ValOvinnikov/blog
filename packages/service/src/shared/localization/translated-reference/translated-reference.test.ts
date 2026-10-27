import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_TRANSLATION_METADATA,
  mockLandingPageDocument,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

import { translatedReference } from './translated-reference';

faker.seed(6016);

const MOCK_CONTACT_EN_PAGE_ID = faker.string.uuid();
const MOCK_LINK_ID = faker.string.uuid();
const { EN, NL, FR } = LOCALE_ISO_CODES;

const localeQ = q.parameters<TLocaleQueryParams>();

const query = localeQ.star
  .filterByType('link')
  .slice(0)
  .project((sub) => ({
    target: translatedReference(
      sub,
      (filter) =>
        sub
          .field('internalReference')
          .deref()
          .asCombined()
          .project((page) => ({
            translated: page.star
              .filterByType('translation.metadata')
              .filterBy('references(^._id)')
              .slice(0)
              .field('translations[]')
              .filterBy(filter)
              .slice(0)
              .field('value')
              .deref()
              .project(() => ({ _id: true })),
          }))
          .field('translated'),
      sub
        .field('internalReference')
        .deref()
        .asCombined()
        .project(() => ({ _id: true })),
    ),
  }));

const MOCK_PAGES_DATASET = [
  mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN),
  mockLandingPageDocument(MOCK_ABOUT_NL_PAGE_ID, NL),
  mockLandingPageDocument(MOCK_CONTACT_EN_PAGE_ID, EN),
  MOCK_ABOUT_TRANSLATION_METADATA,
];

function resolveId(pageId: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    query.query,
    [
      {
        _id: MOCK_LINK_ID,
        _type: 'link',
        internalReference: mockReference(pageId),
      },
      ...MOCK_PAGES_DATASET,
    ],
    undefined,
    { locale, defaultLocale: EN },
  );
}

describe(translatedReference, () => {
  it.each([
    {
      behaviour: 'resolves to the translation in the requested language',
      pageId: MOCK_ABOUT_EN_PAGE_ID,
      locale: NL,
      expectedId: MOCK_ABOUT_NL_PAGE_ID,
    },
    {
      behaviour: 'falls back to the default-language page with no translation',
      pageId: MOCK_ABOUT_EN_PAGE_ID,
      locale: FR,
      expectedId: MOCK_ABOUT_EN_PAGE_ID,
    },
    {
      behaviour: 'resolves from a translation back to the requested language',
      pageId: MOCK_ABOUT_NL_PAGE_ID,
      locale: EN,
      expectedId: MOCK_ABOUT_EN_PAGE_ID,
    },
    {
      behaviour: 'resolves to the referenced page when it has no translations',
      pageId: MOCK_CONTACT_EN_PAGE_ID,
      locale: NL,
      expectedId: MOCK_CONTACT_EN_PAGE_ID,
    },
  ])('$behaviour', async ({ pageId, locale, expectedId }) => {
    const result = await resolveId(pageId, locale);

    expect(result).toEqual({ target: { _id: expectedId } });
  });
});
