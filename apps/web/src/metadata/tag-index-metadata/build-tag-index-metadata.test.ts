import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { NL_TAGS_INDEX_PATH } from '@web/testing/metadata/index-paths/fixtures';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagIndexMetadata } from './build-tag-index-metadata';

const { getTagIndexPageMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/tag-index/get-tag-index-page/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5206);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const INDEX_PATH = routes.tags();

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const resolveIndexPageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getTagIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: mockHeadingBlock({ heading: title }),
      seo: MOCK_SEO,
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

  it('reads the index page the tag index renders', async () => {
    await buildTagIndexMetadata();

    expect(getTagIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to the tag index', async () => {
    const metadata = await buildTagIndexMetadata();

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBe(description);
    expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
    expect(metadata.openGraph?.title).toBe(ogTitle);
    expect(metadata.openGraph?.description).toBe(ogDescription);
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
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolveIndexPageWith([EN, NL, DE]);

    const metadata = await buildTagIndexMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_TAGS_INDEX_PATH,
      languages: {
        en: INDEX_PATH,
        nl: NL_TAGS_INDEX_PATH,
        'x-default': INDEX_PATH,
      },
    });
  });
});
