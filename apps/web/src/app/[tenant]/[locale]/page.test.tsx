import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import HomeRoute, { generateMetadata, revalidate } from './page';

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      home: { v1: { getHomePage: getHomePageMock } },
    },
  },
}));

vi.mock('@web/components/pages/home-page', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

describe('HomeRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: 'a-slug',
    });

    await HomeRoute({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders HomePage without forwarding route params', async () => {
    const ui = await HomeRoute({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    expect(ui.props).toEqual({});
  });
});

describe('generateMetadata', () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
  });

  it('returns empty metadata and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const metadata = await generateMetadata({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
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
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
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
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
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
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
  });

  it('enters the request context with the route params', async () => {
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
    });

    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('forwards the request context Sanity context to getHomePage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: { hero: { id: 'hero-1' }, modules: [], seo: makeSeo() },
    });

    await generateMetadata({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });
});
