import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagIndexMetadata } from './build-tag-index-metadata';

const { getTagIndexPageMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/tag-index/get-tag-index-page/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const TITLE = 'Tags';
const INDEX_PATH = routes.tags();
const NL_INDEX_PATH = `/nl${INDEX_PATH}`;
const DESCRIPTION = 'Browse every post by tag.';
const OG_DESCRIPTION = 'Browse every post by tag OG.';

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: 'Tags OG',
  ogDescription: OG_DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

const resolveIndexPageWith = (
  translations: TLocaleIsoCode[] = [LOCALE_ISO_CODES.EN],
) =>
  getTagIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: { heading: TITLE },
      seo,
      modules: [],
      translations,
    }),
  );

describe(buildTagIndexMetadata, () => {
  beforeEach(() => {
    getTagIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolveIndexPageWith();
  });

  it('reads the same index page the tag index renders', async () => {
    await buildTagIndexMetadata();

    expect(getTagIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to /tags', async () => {
    const metadata = await buildTagIndexMetadata();

    expect(metadata.title).toBe(TITLE);
    expect(metadata.description).toBe(DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
    expect(metadata.openGraph?.title).toBe('Tags OG');
    expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
    expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getTagIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildTagIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'tag_index_metadata.fetch_failed',
        { error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when the page does not exist', async () => {
      getTagIndexPageMock.mockResolvedValue(okResult());

      const metadata = await buildTagIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  it('lists each live translated language as hreflang, canonical to its prefix', async () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;
    const translations = [EN, NL, DE];
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    resolveIndexPageWith(translations);

    const metadata = await buildTagIndexMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_INDEX_PATH,
      languages: {
        en: INDEX_PATH,
        nl: NL_INDEX_PATH,
        'x-default': INDEX_PATH,
      },
    });
  });
});
