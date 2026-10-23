import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TPostDetail } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_POST_DETAIL } from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_DE_POST_SLUG,
  MOCK_EN_POST_SLUG,
  MOCK_NL_POST_SLUG,
} from '@web/testing/shared/post/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildPostMetadata } from './build-post-metadata';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const {
  title: TITLE,
  slug: SLUG,
  excerpt: EXCERPT,
  publishedAt,
  author,
} = MOCK_POST_DETAIL;
const OG_TITLE = 'Hello World OG';
const OG_DESCRIPTION = 'A sufficiently long excerpt for the card OG.';
const NL_POST_PATH = `/nl${routes.post(MOCK_NL_POST_SLUG)}`;
const EN_POST_PATH = routes.post(MOCK_EN_POST_SLUG);

const basePost: TPostDetail = {
  ...MOCK_POST_DETAIL,
  seo: mockSeo({
    title: TITLE,
    description: EXCERPT,
    ogTitle: OG_TITLE,
    ogDescription: OG_DESCRIPTION,
    ogImage: MOCK_OG_IMAGE,
  }),
};

describe(buildPostMetadata, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the post resolves', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue(okResult(basePost));
    });

    it('reads the same post the post page renders', async () => {
      await buildPostMetadata(SLUG);

      expect(getPostPageMock).toHaveBeenCalledWith(SLUG);
    });

    it('builds the metadata from the resolved seo', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(metadata.title).toBe(TITLE);
      expect(metadata.description).toBe(EXCERPT);
      expect(metadata.alternates?.canonical).toBe(routes.post(SLUG));
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('sets the OG published time from the publish date', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(
        (metadata.openGraph as { publishedTime?: string })?.publishedTime,
      ).toBe(publishedAt);
    });

    it('sets the OG authors from the author name', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
        author.name,
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata without logging when no post matches', async () => {
      getPostPageMock.mockResolvedValue(okResult());

      const metadata = await buildPostMetadata('missing');

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('returns empty metadata when the post fetch fails', async () => {
      getPostPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildPostMetadata(SLUG);

      expect(metadata).toEqual({});
    });
  });

  describe('for a Dutch-language request', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
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
