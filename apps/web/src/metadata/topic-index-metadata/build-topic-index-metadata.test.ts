import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTopicIndexMetadata } from './build-topic-index-metadata';

const { getTopicIndexPageMock } = vi.hoisted(() => ({
  getTopicIndexPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/topic-index/get-topic-index-page/get-topic-index-page',
  () => ({
    getTopicIndexPage: getTopicIndexPageMock,
  }),
);

vi.mock('@web/server/request-context/request-context');

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'Browse every post by topic.';
const OG_DESCRIPTION = 'Browse every post by topic OG.';
const NL_TOPICS_PATH = '/nl/topics';

const seo = makeSeo({
  title: 'Topics',
  description: DESCRIPTION,
  ogTitle: 'Topics OG',
  ogDescription: OG_DESCRIPTION,
  ogImage,
});

describe('buildTopicIndexMetadata', () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  describe('when the index page resolves', () => {
    beforeEach(() => {
      getTopicIndexPageMock.mockResolvedValue({
        ok: true,
        data: {
          headingBlock: { heading: 'Topics' },
          seo,
          modules: [],
          translations: [LOCALE_ISO_CODES.EN],
        },
      });
    });

    it('reads the page through getTopicIndexPage, the loader TopicIndexPage reads', async () => {
      await buildTopicIndexMetadata();

      expect(getTopicIndexPageMock).toHaveBeenCalledWith();
    });

    it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
      const metadata = await buildTopicIndexMetadata();

      expect(metadata.title).toBe('Topics');
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe('/topics');
      expect(metadata.openGraph?.title).toBe('Topics OG');
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getTopicIndexPageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'topic_index_metadata.fetch_failed',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('returns empty metadata without logging when the index page simply does not exist', async () => {
      getTopicIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  it('lists every live language with its own page as hreflang, canonical to its own prefixed address', async () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;
    const translations = [EN, NL, DE];
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: { heading: 'Topics' },
        seo,
        modules: [],
        translations,
      },
    });

    const metadata = await buildTopicIndexMetadata();

    expect(metadata.alternates).toMatchObject({
      canonical: NL_TOPICS_PATH,
      languages: { en: '/topics', nl: NL_TOPICS_PATH, 'x-default': '/topics' },
    });
  });
});
