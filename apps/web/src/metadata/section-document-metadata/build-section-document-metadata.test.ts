import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_BILINGUAL_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSectionDocumentDetail } from '@web/testing/shared/section-document/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildSectionDocumentMetadata } from './build-section-document-metadata';

const { getSectionDocumentPageMock } = vi.hoisted(() => ({
  getSectionDocumentPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/section-document/get-section-document-page/get-section-document-page',
  () => ({ getSectionDocumentPage: getSectionDocumentPageMock }),
);

vi.mock('@web/server/request-context/request-context');

faker.seed(6522);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_SEO_TITLE = faker.lorem.words(3);
const MOCK_SEO_DESCRIPTION = faker.lorem.sentence();

const mockTranslatedDocument = () =>
  okResult(
    mockSectionDocumentDetail({
      slug: MOCK_SLUG,
      seo: {
        title: MOCK_SEO_TITLE,
        description: MOCK_SEO_DESCRIPTION,
        ogTitle: MOCK_SEO_TITLE,
        ogDescription: MOCK_SEO_DESCRIPTION,
        ogImage: undefined,
      },
      translations: [
        { language: EN, slug: MOCK_SLUG },
        { language: NL, slug: MOCK_NL_SLUG },
      ],
    }),
  );

describe(buildSectionDocumentMetadata, () => {
  beforeEach(() => {
    getSectionDocumentPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(
      MOCK_BILINGUAL_REQUEST_CONTEXT,
    );
  });

  it('reads the document of the given type and slug', async () => {
    getSectionDocumentPageMock.mockResolvedValue(mockTranslatedDocument());

    await buildSectionDocumentMetadata('page_legalDocument', MOCK_SLUG);

    expect(getSectionDocumentPageMock).toHaveBeenCalledWith(
      'page_legalDocument',
      MOCK_SLUG,
    );
  });

  it("maps the document's own title and description", async () => {
    getSectionDocumentPageMock.mockResolvedValue(mockTranslatedDocument());

    const metadata = await buildSectionDocumentMetadata(
      'page_privacyDocument',
      MOCK_SLUG,
    );

    expect(metadata.title).toBe(MOCK_SEO_TITLE);
    expect(metadata.description).toBe(MOCK_SEO_DESCRIPTION);
  });

  it.each([
    { type: 'page_privacyDocument' as const, toHref: routes.privacyDocument },
    { type: 'page_legalDocument' as const, toHref: routes.legalDocument },
  ])(
    'is canonical to its own $type path and lists each translation',
    async ({ type, toHref }) => {
      getSectionDocumentPageMock.mockResolvedValue(mockTranslatedDocument());

      const metadata = await buildSectionDocumentMetadata(type, MOCK_SLUG);

      expect(metadata.alternates).toEqual({
        canonical: toHref(MOCK_SLUG),
        languages: {
          en: toHref(MOCK_SLUG),
          nl: `${NL_PATH_PREFIX}${toHref(MOCK_NL_SLUG)}`,
          'x-default': toHref(MOCK_SLUG),
        },
      });
    },
  );

  it('returns empty metadata and logs when the fetch fails', async () => {
    getSectionDocumentPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const metadata = await buildSectionDocumentMetadata(
      'page_privacyDocument',
      MOCK_SLUG,
    );

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SECTION_DOCUMENT_LOG.METADATA_FETCH_FAILED,
      { type: 'page_privacyDocument', slug: MOCK_SLUG, error: MOCK_ERROR },
    );
  });

  it('returns empty metadata without logging when no document matches', async () => {
    getSectionDocumentPageMock.mockResolvedValue(okResult());

    const metadata = await buildSectionDocumentMetadata(
      'page_privacyDocument',
      MOCK_SLUG,
    );

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });
});
