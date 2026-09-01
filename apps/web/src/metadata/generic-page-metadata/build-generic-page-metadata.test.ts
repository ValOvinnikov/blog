import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildGenericPageMetadata } from './build-generic-page-metadata';

const { getPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPage: getPageMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const seo = makeSeo({
  title: 'About Us',
  description: 'Who we are.',
  ogTitle: 'About Us OG',
  ogDescription: 'Who we are OG.',
  ogImageUrl: 'https://cdn.example.com/about-og.jpg',
});

describe('buildGenericPageMetadata', () => {
  beforeEach(() => {
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('forwards the resolved tenant Sanity context to getPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPageMock.mockResolvedValue({
      ok: true,
      data: { title: 'About Us', slug: 'about-us', modules: [], seo },
    });

    await buildGenericPageMetadata('about-us');

    expect(getPageMock).toHaveBeenCalledWith('about-us', tenant);
  });

  it('maps the resolved seo straight through toMetadata, self-canonical to /[slug]', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: { title: 'About Us', slug: 'about-us', modules: [], seo },
    });

    const metadata = await buildGenericPageMetadata('about-us');

    expect(metadata.title).toBe('About Us');
    expect(metadata.description).toBe('Who we are.');
    expect(metadata.alternates?.canonical).toBe('/about-us');
    expect(metadata.openGraph?.title).toBe('About Us OG');
    expect(metadata.openGraph?.description).toBe('Who we are OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/about-og.jpg' },
    ]);
  });

  it('returns empty metadata and logs when the page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const metadata = await buildGenericPageMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('generic_page_metadata.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildGenericPageMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
