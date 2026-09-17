import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { HomePage } from './home-page';

const {
  getHomePageMock,
  getTenantSanityContextMock,
  pageIntroMock,
  moduleRendererMock,
} = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  pageIntroMock: vi.fn(
    ({
      hero,
      headingBlock,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
    }): ReactNode => (
      <h1 data-testid="page-intro">{hero ? hero.id : headingBlock.heading}</h1>
    ),
  ),
  moduleRendererMock: vi.fn(({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  )),
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

vi.mock('@web/components/shared/page-intro', () => ({
  PageIntro: pageIntroMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
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
    pageIntroMock.mockClear();
    moduleRendererMock.mockClear();
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

  it('dispatches PageIntro with the heading and no hero when the page has none', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: undefined,
        modules: [],
      },
    });

    await setup();

    expect(pageIntroMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: undefined,
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent(
      'Welcome to the blog',
    );
  });

  it('dispatches PageIntro with the hero when the page has one', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(pageIntroMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent('hero-1');
  });

  it('renders through PageShell: the intro then the module renderer, inside a single main landmark', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock(),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    const { container } = await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('page-intro'));
    expect(main).toContainElement(screen.getByTestId('module-renderer'));

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));
    expect(order).toEqual(['page-intro', 'module-renderer']);
  });

  it('passes the fetched modules and locale through to ModuleRenderer', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      {
        modules: [{ id: 'module-1', type: 'module_content' }],
        locale: 'en',
        tenant: 'tenant-1',
      },
      undefined,
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
