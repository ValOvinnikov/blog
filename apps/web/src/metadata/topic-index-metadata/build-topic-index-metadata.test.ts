import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import type { MockInstance } from 'vitest';

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

const seo = makeSeo({
  title: 'Topics',
  description: 'Browse every post by topic.',
  ogTitle: 'Topics OG',
  ogDescription: 'Browse every post by topic OG.',
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
      expect(metadata.description).toBe('Browse every post by topic.');
      expect(metadata.alternates?.canonical).toBe('/topics');
      expect(metadata.openGraph?.title).toBe('Topics OG');
      expect(metadata.openGraph?.description).toBe(
        'Browse every post by topic OG.',
      );
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getTopicIndexPageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('topic_index_metadata.fetch_failed'),
      );
    });

    it('returns empty metadata without logging when the index page simply does not exist', async () => {
      getTopicIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(errorSpy).not.toHaveBeenCalled();
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
      canonical: '/nl/topics',
      languages: { en: '/topics', nl: '/nl/topics', 'x-default': '/topics' },
    });
  });
});
