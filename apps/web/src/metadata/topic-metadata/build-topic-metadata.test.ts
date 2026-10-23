import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const ogImage = mockSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'Posts about building things.';
const OG_TITLE = 'Engineering OG';
const OG_DESCRIPTION = 'Posts about building things OG.';
const TOPIC_PATH = '/topics/engineering';
const NL_DESIGN_TOPIC_PATH = '/nl/topics/ontwerp';
const EN_DESIGN_TOPIC_PATH = '/topics/design';

const seo = mockSeo({
  title: 'Engineering',
  description: DESCRIPTION,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
  ogImage,
});

const resolveTopicPageWith = (overrides: Record<string, unknown> = {}) =>
  getTopicPageMock.mockResolvedValue(
    okResult({ topic: {}, modules: [], seo, translations: [], ...overrides }),
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
      await buildTopicMetadata('engineering');

      expect(getTopicPageMock).toHaveBeenCalledWith('engineering');
    });

    it('builds page-1 metadata from the seo, canonical to the topic', async () => {
      const metadata = await buildTopicMetadata('engineering');

      expect(metadata.title).toBe('Engineering');
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe(TOPIC_PATH);
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });

    it('suffixes page-N titles with the page, canonical to that page', async () => {
      const metadata = await buildTopicMetadata('engineering', 2);

      expect(metadata.title).toBe('Engineering – Page 2');
      expect(metadata.openGraph?.title).toBe('Engineering OG – Page 2');
      expect(metadata.alternates?.canonical).toBe('/topics/engineering/page/2');
      expect(metadata.alternates?.canonical).not.toBe(TOPIC_PATH);
    });
  });

  describe('when the topic fetch fails', () => {
    beforeEach(() => {
      getTopicPageMock.mockResolvedValue(errorResult(new Error('boom')));
    });

    it.each([
      { slug: 'engineering', page: undefined },
      { slug: 'missing', page: 2 },
    ])(
      'returns empty metadata on page $page when the fetch fails',
      async ({ slug, page }) => {
        const metadata = await buildTopicMetadata(slug, page);

        expect(metadata).toEqual({});
      },
    );
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveTopicPageWith({ seo: mockSeo({ ogTitle: undefined }) });

    const metadata = await buildTopicMetadata('engineering', 2);

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
        ...DEFAULT_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
      resolveTopicPageWith({
        translations: [
          { language: EN, slug: 'design' },
          { language: NL, slug: 'ontwerp' },
          { language: DE, slug: 'gestaltung' },
        ],
      });
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
      const metadata = await buildTopicMetadata('ontwerp');

      expect(metadata.alternates).toMatchObject({
        canonical: NL_DESIGN_TOPIC_PATH,
        languages: {
          en: EN_DESIGN_TOPIC_PATH,
          nl: NL_DESIGN_TOPIC_PATH,
          'x-default': EN_DESIGN_TOPIC_PATH,
        },
      });
    });

    it('lists no hreflang past page 1', async () => {
      const metadata = await buildTopicMetadata('ontwerp', 2);

      expect(metadata.alternates?.canonical).toBe('/nl/topics/ontwerp/page/2');
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });
});
