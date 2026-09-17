import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import HomeRoute, { generateMetadata, revalidate } from './page';

const { getHomePageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      home: { v1: { getHomePage: getHomePageMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/pages/home-page', () => ({
  HomePage: ({ locale, tenant }: { locale: string; tenant: string }) => (
    <div data-testid="home-page">
      {locale}-{tenant}
    </div>
  ),
}));

describe('HomeRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders HomePage with the resolved locale and tenant', async () => {
    const ui = await HomeRoute({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(ui.props.locale).toBe('en');
    expect(ui.props.tenant).toBe('tenant-1');
  });
});

describe('generateMetadata', () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('returns empty metadata and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('home_page.metadata_fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the home page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('builds absolute-title metadata from the resolved seo, self-canonical to /', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
        seo: makeSeo({ title: 'Home' }),
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(metadata.title).toEqual({ absolute: 'Home' });
    expect(metadata.alternates?.canonical).toBe('/');
  });

  it('omits the OG/Twitter card images when the resolved seo carries no ogImageUrl', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
        seo: makeSeo(),
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
  });

  it('forwards the resolved tenant Sanity context to getHomePage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: { hero: { id: 'hero-1' }, modules: [], seo: makeSeo() },
    });

    await generateMetadata({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
    });

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });
});
