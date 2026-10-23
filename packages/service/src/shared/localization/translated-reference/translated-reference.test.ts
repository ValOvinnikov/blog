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

import { translatedReference } from './translated-reference';

const CONTACT_EN_PAGE_ID = 'contact-en';
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

const dataset = [
  mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN),
  mockLandingPageDocument(MOCK_ABOUT_NL_PAGE_ID, NL),
  mockLandingPageDocument(CONTACT_EN_PAGE_ID, EN),
  MOCK_ABOUT_TRANSLATION_METADATA,
];

function resolveId(pageId: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    query.query,
    [
      {
        _id: 'link-1',
        _type: 'link',
        internalReference: mockReference(pageId),
      },
      ...dataset,
    ],
    undefined,
    { locale, defaultLocale: EN },
  );
}

describe(translatedReference, () => {
  it('resolves to the translation in the requested language', async () => {
    expect(await resolveId(MOCK_ABOUT_EN_PAGE_ID, NL)).toMatchObject({
      target: { _id: MOCK_ABOUT_NL_PAGE_ID },
    });
  });

  it('falls back to the default-language page when no translation exists', async () => {
    expect(await resolveId(MOCK_ABOUT_EN_PAGE_ID, FR)).toMatchObject({
      target: { _id: MOCK_ABOUT_EN_PAGE_ID },
    });
  });

  it('resolves from a translation back to the requested language', async () => {
    expect(await resolveId(MOCK_ABOUT_NL_PAGE_ID, EN)).toMatchObject({
      target: { _id: MOCK_ABOUT_EN_PAGE_ID },
    });
  });

  it('resolves to the referenced page when it has no translations at all', async () => {
    expect(await resolveId(CONTACT_EN_PAGE_ID, NL)).toMatchObject({
      target: { _id: CONTACT_EN_PAGE_ID },
    });
  });
});
