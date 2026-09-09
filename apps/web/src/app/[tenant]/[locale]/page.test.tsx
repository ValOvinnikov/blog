import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import HomePage, { generateMetadata, revalidate } from './page';

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

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: ({ id }: { id: string }) => (
    <div data-testid="hero-module">{id}</div>
  ),
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: ({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  ),
}));

const setup = customRenderAsync(HomePage, {
  params: Promise.resolve({ tenant: 'tenant-1', locale: 'en' }),
});

describe('HomePage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  beforeEach(() => {
    getHomePageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('home_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the home page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the hero and module renderer from the fetched home page', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        sectionHeader: { heading: undefined, supportingText: undefined },
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: makeSeo(),
      },
    });

    await setup();

    expect(screen.getByTestId('hero-module')).toHaveTextContent('hero-1');
    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });

  it('renders through PageShell: hero, then module renderer, inside a single main landmark, with no breadcrumb region', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        sectionHeader: { heading: undefined, supportingText: undefined },
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: makeSeo(),
      },
    });

    const { container } = await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('hero-module'));
    expect(main).toContainElement(screen.getByTestId('module-renderer'));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));
    expect(order).toEqual(['hero-module', 'module-renderer']);
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
      data: {
        sectionHeader: { heading: undefined, supportingText: undefined },
        hero: { id: 'hero-1' },
        modules: [],
        seo: makeSeo(),
      },
    });

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });

  it('renders the heading and supporting text when there is no hero', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Home — internal label',
        sectionHeader: {
          heading: 'Welcome to the blog',
          supportingText: 'Fresh posts every week.',
        },
        hero: undefined,
        modules: [],
        seo: makeSeo(),
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to the blog' }),
    ).toBeVisible();
    expect(screen.getByText('Fresh posts every week.')).toBeVisible();
    expect(screen.queryByTestId('hero-module')).not.toBeInTheDocument();
  });

  it('renders the hero, not the heading, when both are present', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Home — internal label',
        sectionHeader: {
          heading: 'Welcome to the blog',
          supportingText: 'Fresh posts every week.',
        },
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
        seo: makeSeo(),
      },
    });

    await setup();

    expect(screen.getByTestId('hero-module')).toHaveTextContent('hero-1');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome to the blog')).not.toBeInTheDocument();
  });

  it('renders nothing in the heading region — never the internal title — when there is no hero and no heading', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Home — internal label',
        sectionHeader: { heading: undefined, supportingText: undefined },
        hero: undefined,
        modules: [],
        seo: makeSeo(),
      },
    });

    await setup();

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText('Home — internal label')).not.toBeInTheDocument();
  });

  it('never renders the internal title as the visible h1 when a heading is set', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'Home — internal label',
        sectionHeader: {
          heading: 'Welcome to the blog',
          supportingText: undefined,
        },
        hero: undefined,
        modules: [],
        seo: makeSeo(),
      },
    });

    await setup();

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Welcome to the blog');
    expect(h1).not.toHaveTextContent('Home — internal label');
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

  it('falls back to the generated OG/Twitter card images when the resolved seo carries no ogImageUrl', async () => {
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

    expect(metadata.openGraph?.images).toEqual([{ url: '/opengraph-image' }]);
    expect(metadata.twitter?.images).toEqual(['/twitter-image']);
  });
});
