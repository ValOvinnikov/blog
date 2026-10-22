import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildPostIndexMetadata } from './build-post-index-metadata';

const { getPostIndexPageMock } = vi.hoisted(() => ({
  getPostIndexPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/post-index/get-post-index-page/get-post-index-page',
  () => ({
    getPostIndexPage: getPostIndexPageMock,
  }),
);

vi.mock('@web/server/request-context/request-context');

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'All the posts.';
const OG_DESCRIPTION = 'All the posts OG.';
const PAGE_TWO_OG_TITLE = 'The Blog OG – Page 2';
const OG_TITLE = 'The Blog OG';

const seo = makeSeo({
  title: 'The Blog',
  description: DESCRIPTION,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
  ogImage,
});

describe('buildPostIndexMetadata', () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  describe('when the index page resolves', () => {
    beforeEach(() => {
      getPostIndexPageMock.mockResolvedValue({
        ok: true,
        data: {
          title: 'Blog',
          headingBlock: makeHeadingBlock({ heading: 'Blog' }),
          seo,
          modules: [],
          translations: [LOCALE_ISO_CODES.EN],
        },
      });
    });

    it('reads the page through getPostIndexPage, the loader PostIndexPage reads', async () => {
      await buildPostIndexMetadata(1);

      expect(getPostIndexPageMock).toHaveBeenCalledWith();
    });

    it('builds page-1 metadata from the resolved seo, self-canonical to /blog', async () => {
      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.title).toBe('The Blog');
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe('/blog');
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
      expect(metadata.alternates?.types).toEqual({
        'application/rss+xml': '/rss.xml',
      });
    });

    it('builds page-N metadata with a "– Page N" suffix, canonical to /blog/page/N', async () => {
      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.title).toBe('The Blog – Page 2');
      expect(metadata.openGraph?.title).toBe(PAGE_TWO_OG_TITLE);
      expect(metadata.twitter?.title).toBe(PAGE_TWO_OG_TITLE);
      expect(metadata.alternates?.canonical).toBe('/blog/page/2');
      expect(metadata.alternates?.canonical).not.toBe('/blog');
      expect(metadata.alternates?.types).toEqual({
        'application/rss+xml': '/rss.xml',
      });
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getPostIndexPageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'post_index_metadata.fetch_failed',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('returns empty metadata without logging when the index page simply does not exist', async () => {
      getPostIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  describe('for a Dutch-language request', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...DEFAULT_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
    });

    it('lists every live language with its own page as hreflang, canonical to its own prefixed address', async () => {
      const translations = [EN, NL, DE];
      getPostIndexPageMock.mockResolvedValue({
        ok: true,
        data: {
          headingBlock: makeHeadingBlock({ heading: 'Blog' }),
          seo,
          modules: [],
          translations,
        },
      });

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.alternates).toMatchObject({
        canonical: '/nl/blog',
        languages: { en: '/blog', nl: '/nl/blog', 'x-default': '/blog' },
        types: { 'application/rss+xml': '/nl/rss.xml' },
      });
    });

    it('lists no hreflang past page 1', async () => {
      const translations = [EN, NL];
      getPostIndexPageMock.mockResolvedValue({
        ok: true,
        data: {
          headingBlock: makeHeadingBlock({ heading: 'Blog' }),
          seo,
          modules: [],
          translations,
        },
      });

      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.alternates?.canonical).toBe('/nl/blog/page/2');
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });

  it('leaves ogTitle omitted on page 2+ when unauthored, never suffixing "undefined"', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Blog',
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        seo: makeSeo({ title: 'The Blog', ogTitle: undefined }),
        modules: [],
        translations: [LOCALE_ISO_CODES.EN],
      },
    });

    const metadata = await buildPostIndexMetadata(2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });
});
