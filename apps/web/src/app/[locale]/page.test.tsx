import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import HomePage, { generateMetadata } from './page';

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

vi.mock('@web/modules/hero/hero-module', () => ({
  HeroModule: ({ id }: { id: string }) => (
    <div data-testid="hero-module">{id}</div>
  ),
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: ({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  ),
}));

const setup = customRenderAsync(HomePage, {
  params: Promise.resolve({ locale: 'en' }),
});

describe('HomePage', () => {
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
        hero: { id: 'hero-1' },
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

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
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

    const metadata = await generateMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('home_page.metadata_fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the home page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await generateMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('builds absolute-title metadata from the resolved seo, self-canonical to /', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        hero: { id: 'hero-1' },
        modules: [],
        seo: makeSeo({ title: 'Home' }),
      },
    });

    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({ absolute: 'Home' });
    expect(metadata.alternates?.canonical).toBe('/');
  });
});
