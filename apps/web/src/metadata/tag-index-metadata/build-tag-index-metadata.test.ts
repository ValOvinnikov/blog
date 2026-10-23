import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagIndexMetadata } from './build-tag-index-metadata';

const { getTagIndexPageMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/tag-index/get-tag-index-page/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'Browse every post by tag.';
const OG_DESCRIPTION = 'Browse every post by tag OG.';

const seo = mockSeo({
  title: 'Tags',
  description: DESCRIPTION,
  ogTitle: 'Tags OG',
  ogDescription: OG_DESCRIPTION,
  ogImage,
});

describe('buildTagIndexMetadata', () => {
  beforeEach(() => {
    getTagIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getTagIndexPageMock.mockResolvedValue(
      okResult({
        headingBlock: { heading: 'Tags' },
        seo,
        modules: [],
        translations: [LOCALE_ISO_CODES.EN],
      }),
    );
  });

  it('reads the page through getTagIndexPage', async () => {
    await buildTagIndexMetadata();

    expect(getTagIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to /tags', async () => {
    const metadata = await buildTagIndexMetadata();

    expect(metadata.title).toBe('Tags');
    expect(metadata.description).toBe(DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe('/tags');
    expect(metadata.openGraph?.title).toBe('Tags OG');
    expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getTagIndexPageMock.mockResolvedValue(errorResult(new Error('boom')));

      const metadata = await buildTagIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'tag_index_metadata.fetch_failed',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('returns empty metadata without logging when the page does not exist', async () => {
      getTagIndexPageMock.mockResolvedValue(okResult());

      const metadata = await buildTagIndexMetadata();

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
    getTagIndexPageMock.mockResolvedValue(
      okResult({
        headingBlock: { heading: 'Tags' },
        seo,
        modules: [],
        translations,
      }),
    );

    const metadata = await buildTagIndexMetadata();

    expect(metadata.alternates).toMatchObject({
      canonical: '/nl/tags',
      languages: { en: '/tags', nl: '/nl/tags', 'x-default': '/tags' },
    });
  });
});
