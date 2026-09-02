import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildBlogListMetadata } from './build-blog-list-metadata';

const { getIndexPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const seo = makeSeo({
  title: 'The Blog',
  description: 'All the posts.',
  ogTitle: 'The Blog OG',
  ogDescription: 'All the posts OG.',
  ogImageUrl: 'https://cdn.example.com/blog-og.jpg',
});

describe('buildBlogListMetadata', () => {
  beforeEach(() => {
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('forwards the resolved tenant Sanity context to getIndexPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Blog', seo, modules: [], postListId: 'post-list-1' },
    });

    await buildBlogListMetadata(1);

    expect(getIndexPageMock).toHaveBeenCalledWith(tenant);
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo,
        modules: [],
        postListId: 'post-list-1',
      },
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('The Blog');
    expect(metadata.description).toBe('All the posts.');
    expect(metadata.alternates?.canonical).toBe('/blog');
    expect(metadata.openGraph?.title).toBe('The Blog OG');
    expect(metadata.openGraph?.description).toBe('All the posts OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/blog-og.jpg' },
    ]);
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    });
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /blog/page/N — never /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo,
        modules: [],
        postListId: 'post-list-1',
      },
    });

    const metadata = await buildBlogListMetadata(2);

    expect(metadata.title).toBe('The Blog – Page 2');
    expect(metadata.openGraph?.title).toBe('The Blog OG – Page 2');
    expect(metadata.twitter?.title).toBe('The Blog OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/blog/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/blog');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    });
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
