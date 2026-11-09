import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import type { TSectionIndexType } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { SECTION_INDEX_LOG } from '@web/constants/section-index';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
  NL_PATH_PREFIX,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSectionIndexPage } from '@web/testing/shared/section-index/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildSectionIndexMetadata } from './build-section-index-metadata';

const { getSectionIndexPageMock } = vi.hoisted(() => ({
  getSectionIndexPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/section-index/get-section-index-page/get-section-index-page',
  () => ({ getSectionIndexPage: getSectionIndexPageMock }),
);

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;
const PRIVACY_TYPE = 'page_privacyIndex';

const MOCK_SEO = mockMetadataSeo();
const { title, description } = MOCK_SEO;

const resolvePageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getSectionIndexPageMock.mockResolvedValue(
    okResult(mockSectionIndexPage({ seo: MOCK_SEO, translations })),
  );

describe(buildSectionIndexMetadata, () => {
  beforeEach(() => {
    getSectionIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolvePageWith();
  });

  it.each<{ type: TSectionIndexType; href: string }>([
    { type: PRIVACY_TYPE, href: routes.privacy() },
    { type: 'page_legalIndex', href: routes.legal() },
  ])(
    'builds $type metadata from the resolved seo, self-canonical to its hub',
    async ({ type, href }) => {
      const metadata = await buildSectionIndexMetadata(type);

      expect(getSectionIndexPageMock).toHaveBeenCalledWith(type);
      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(href);
    },
  );

  it('lists each live translated language as hreflang, canonical to its prefix', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolvePageWith([EN, NL, DE]);
    const privacyPath = routes.privacy();
    const nlPrivacyPath = `${NL_PATH_PREFIX}${privacyPath}`;

    const metadata = await buildSectionIndexMetadata(PRIVACY_TYPE);

    expect(metadata.alternates).toEqual({
      canonical: nlPrivacyPath,
      languages: {
        en: privacyPath,
        nl: nlPrivacyPath,
        'x-default': privacyPath,
      },
    });
  });

  it('returns empty metadata and logs when the fetch fails', async () => {
    getSectionIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const metadata = await buildSectionIndexMetadata(PRIVACY_TYPE);

    expect(metadata).toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      SECTION_INDEX_LOG.METADATA_FETCH_FAILED,
      { type: PRIVACY_TYPE, error: MOCK_ERROR },
    );
  });

  it('returns empty metadata without logging when no hub is published', async () => {
    getSectionIndexPageMock.mockResolvedValue(okResult());

    const metadata = await buildSectionIndexMetadata(PRIVACY_TYPE);

    expect(metadata).toEqual({});
    expect(logger.error).not.toHaveBeenCalled();
  });
});
