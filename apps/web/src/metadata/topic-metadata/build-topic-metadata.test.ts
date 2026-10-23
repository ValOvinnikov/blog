import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TTopicDetailPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicDetailPage } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const TITLE = 'Engineering';
const SLUG = 'engineering';
const EN_DESIGN_SLUG = 'design';
const NL_SLUG = 'ontwerp';
const DESCRIPTION = 'Posts about building things.';
const OG_TITLE = `${TITLE} OG`;
const OG_DESCRIPTION = 'Posts about building things OG.';
const NL_DESIGN_TOPIC_PATH = `/nl${routes.topic(NL_SLUG)}`;
const EN_DESIGN_TOPIC_PATH = routes.topic(EN_DESIGN_SLUG);

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

const resolveTopicPageWith = (overrides: Partial<TTopicDetailPage> = {}) =>
  getTopicPageMock.mockResolvedValue(
    okResult(mockTopicDetailPage({ seo, ...overrides })),
  );

describe(buildTopicMetadata, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the topic resolves', () => {
    beforeEach(() => {
      resolveTopicPageWith();
    });

    it('reads the same topic the topic page renders', async () => {
      await buildTopicMetadata(SLUG);

      expect(getTopicPageMock).toHaveBeenCalledWith(SLUG);
    });

    it('builds page-1 metadata from the seo, canonical to the topic', async () => {
      const metadata = await buildTopicMetadata(SLUG);

      expect(metadata.title).toBe(TITLE);
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe(routes.topic(SLUG));
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('suffixes page-N titles with the page, canonical to that page', async () => {
      const metadata = await buildTopicMetadata(SLUG, 2);

      expect(metadata.title).toBe(`${TITLE} – Page 2`);
      expect(metadata.openGraph?.title).toBe(`${OG_TITLE} – Page 2`);
      expect(metadata.alternates?.canonical).toBe(routes.topic(SLUG, 2));
    });
  });

  describe('when the topic fetch fails', () => {
    beforeEach(() => {
      getTopicPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it.each([
      { slug: SLUG, page: undefined, scope: 'the first page' },
      { slug: 'missing', page: 2, scope: 'page 2' },
    ])(
      'returns empty metadata on $scope when the fetch fails',
      async ({ slug, page }) => {
        const metadata = await buildTopicMetadata(slug, page);

        expect(metadata).toEqual({});
      },
    );
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveTopicPageWith({ seo: mockSeo({ ogTitle: undefined }) });

    const metadata = await buildTopicMetadata(SLUG, 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  it('returns empty metadata without logging when no topic matches', async () => {
    getTopicPageMock.mockResolvedValue(okResult());

    const metadata = await buildTopicMetadata('missing');

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  describe('for a Dutch-language request', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
      resolveTopicPageWith({
        translations: [
          { language: EN, slug: EN_DESIGN_SLUG },
          { language: NL, slug: NL_SLUG },
          { language: DE, slug: 'gestaltung' },
        ],
      });
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
      const metadata = await buildTopicMetadata(NL_SLUG);

      expect(metadata.alternates).toEqual({
        canonical: NL_DESIGN_TOPIC_PATH,
        languages: {
          en: EN_DESIGN_TOPIC_PATH,
          nl: NL_DESIGN_TOPIC_PATH,
          'x-default': EN_DESIGN_TOPIC_PATH,
        },
      });
    });

    it('lists no hreflang past page 1', async () => {
      const metadata = await buildTopicMetadata(NL_SLUG, 2);

      expect(metadata.alternates?.canonical).toBe(
        `/nl${routes.topic(NL_SLUG, 2)}`,
      );
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });
});
