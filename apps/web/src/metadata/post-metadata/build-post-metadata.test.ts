import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TPostDetail } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_POST_DETAIL } from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_DE_POST_SLUG,
  MOCK_EN_POST_SLUG,
  MOCK_NL_POST_SLUG,
} from '@web/testing/shared/post/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildPostMetadata } from './build-post-metadata';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5205);

const { slug: SLUG, publishedAt, author } = MOCK_POST_DETAIL;
const { EN, NL, DE } = LOCALE_ISO_CODES;
const NL_POST_PATH = `${NL_PATH_PREFIX}${routes.post(MOCK_NL_POST_SLUG)}`;
const EN_POST_PATH = routes.post(MOCK_EN_POST_SLUG);
const MOCK_MISSING_SLUG = faker.lorem.slug();

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const basePost: TPostDetail = { ...MOCK_POST_DETAIL, seo: MOCK_SEO };

describe(buildPostMetadata, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the post resolves', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue(okResult(basePost));
    });

    it('reads the post the post page renders', async () => {
      await buildPostMetadata(SLUG);

      expect(getPostPageMock).toHaveBeenCalledWith(SLUG);
    });

    it('builds the metadata from the resolved seo', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(routes.post(SLUG));
      expect(metadata.openGraph?.title).toBe(ogTitle);
      expect(metadata.openGraph?.description).toBe(ogDescription);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('sets the OG published time and authors from the post', async () => {
      const metadata = await buildPostMetadata(SLUG);

      const { publishedTime, authors } = metadata.openGraph as {
        publishedTime?: string;
        authors?: string[];
      };

      expect(publishedTime).toBe(publishedAt);
      expect(authors).toEqual([author.name]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata without logging when no post matches', async () => {
      getPostPageMock.mockResolvedValue(okResult());

      const metadata = await buildPostMetadata(MOCK_MISSING_SLUG);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('returns empty metadata and logs when the post fetch fails', async () => {
      getPostPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildPostMetadata(SLUG);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'post_metadata.fetch_failed',
        { slug: SLUG, error: MOCK_ERROR },
      );
    });
  });

  describe('for a Dutch-language request', () => {
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue(
        MOCK_DUTCH_REQUEST_CONTEXT,
      );
      getPostPageMock.mockResolvedValue(
        okResult({
          ...basePost,
          slug: MOCK_NL_POST_SLUG,
          translations: [
            { language: EN, slug: MOCK_EN_POST_SLUG },
            { language: NL, slug: MOCK_NL_POST_SLUG },
            { language: DE, slug: MOCK_DE_POST_SLUG },
          ],
        }),
      );
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
      const metadata = await buildPostMetadata(MOCK_NL_POST_SLUG);

      expect(metadata.alternates).toEqual({
        canonical: NL_POST_PATH,
        languages: {
          en: EN_POST_PATH,
          nl: NL_POST_PATH,
          'x-default': EN_POST_PATH,
        },
      });
    });
  });
});
