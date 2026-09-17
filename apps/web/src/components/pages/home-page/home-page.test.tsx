import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import { HomePage } from './home-page';

const { getHomePageMock, getTenantSanityContextMock, homeModuleRendererMock } =
  vi.hoisted(() => ({
    getHomePageMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
    homeModuleRendererMock: vi.fn(
      ({
        hero,
        headingBlock,
        modules,
      }: {
        hero?: { id: string };
        headingBlock: { heading: string };
        modules: { id: string }[];
      }) => (
        <div data-testid="home-module-renderer">
          {hero ? hero.id : headingBlock.heading} — {modules.length} modules
        </div>
      ),
    ),
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

vi.mock('./home-module-renderer', () => ({
  HomeModuleRenderer: homeModuleRendererMock,
}));

const setup = customRenderAsync(HomePage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${HomePage.name}/>`, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
    homeModuleRendererMock.mockClear();
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

  it('renders through PageShell: the module renderer inside a single main landmark', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('home-module-renderer'));
  });

  it('dispatches HomeModuleRenderer with the fetched hero, heading, and modules', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      {
        hero: { id: 'hero-1', type: 'module_hero' },
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        modules: [{ id: 'module-1', type: 'module_content' }],
        locale: 'en',
        tenant: 'tenant-1',
      },
      undefined,
    );
    expect(screen.getByTestId('home-module-renderer')).toHaveTextContent(
      'hero-1 — 1 modules',
    );
  });

  it('dispatches HomeModuleRenderer with no hero when the page has none', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: undefined,
        modules: [],
      },
    });

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ hero: undefined }),
      undefined,
    );
    expect(screen.getByTestId('home-module-renderer')).toHaveTextContent(
      'Welcome to the blog — 0 modules',
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
      data: {
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
      },
    });

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });
});
