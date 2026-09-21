import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildPostIndexMetadata } from './build-post-index-metadata';

const { getPostIndexPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPostIndexPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/server/post-index/get-post-index-page', () => ({
  getPostIndexPage: getPostIndexPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const seo = makeSeo({
  title: 'The Blog',
  description: 'All the posts.',
  ogTitle: 'The Blog OG',
  ogDescription: 'All the posts OG.',
  ogImage,
});

describe('buildPostIndexMetadata', () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the slug-less tenant to getPostIndexPage — the same cached loader PostIndexPage reads', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Blog',
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        seo,
        modules: [],
      },
    });

    await buildPostIndexMetadata(1, 'tenant-1');

    expect(getPostIndexPageMock).toHaveBeenCalledWith('tenant-1');
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /blog', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Blog',
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        seo,
        modules: [],
      },
    });

    const metadata = await buildPostIndexMetadata(1, 'tenant-1');

    expect(metadata.title).toBe('The Blog');
    expect(metadata.description).toBe('All the posts.');
    expect(metadata.alternates?.canonical).toBe('/blog');
    expect(metadata.openGraph?.title).toBe('The Blog OG');
    expect(metadata.openGraph?.description).toBe('All the posts OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    });
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /blog/page/N — never /blog', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Blog',
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        seo,
        modules: [],
      },
    });

    const metadata = await buildPostIndexMetadata(2, 'tenant-1');

    expect(metadata.title).toBe('The Blog – Page 2');
    expect(metadata.openGraph?.title).toBe('The Blog OG – Page 2');
    expect(metadata.twitter?.title).toBe('The Blog OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/blog/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/blog');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    });
  });

  it('leaves ogTitle omitted on page 2+ when unauthored, rather than suffixing "undefined"', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Blog',
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        seo: makeSeo({ title: 'The Blog', ogTitle: undefined }),
        modules: [],
      },
    });

    const metadata = await buildPostIndexMetadata(2, 'tenant-1');

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildPostIndexMetadata(1, 'tenant-1');

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildPostIndexMetadata(1, 'tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
