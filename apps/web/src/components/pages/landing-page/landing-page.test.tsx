import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

const { getLandingPageMock, moduleRendererMock, pageIntroMock } = vi.hoisted(
  () => ({
    getLandingPageMock: vi.fn(),
    pageIntroMock: vi.fn(
      ({
        hero,
        headingBlock,
      }: {
        hero?: { id: string };
        headingBlock: { heading: string };
      }) => (
        <h1 data-testid="page-intro">
          {hero ? hero.id : headingBlock.heading}
        </h1>
      ),
    ),
    moduleRendererMock: vi.fn(({ modules }: { modules: { id: string }[] }) => (
      <div data-testid="module-renderer">{modules.length} modules</div>
    )),
  }),
);

vi.mock('@web/server/landing/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

vi.mock('@web/components/features/landing/landing-breadcrumbs', () => ({
  LandingBreadcrumbs: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="landing-breadcrumbs">
      {slug}:{tenant}
    </div>
  ),
}));

vi.mock('@web/components/shared/page-intro', () => ({
  PageIntro: pageIntroMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

const setup = customRenderAsync(LandingPage, {
  slug: 'about-us',
  locale: 'EN',
  tenant: 'tenant-1',
});

describe(`<${LandingPage.name}/>`, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    moduleRendererMock.mockClear();
    pageIntroMock.mockClear();
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('landing_page.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('renders the parts in order: breadcrumbs, then the title heading, then module renderer', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'landing-breadcrumbs',
      'page-intro',
      'module-renderer',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside the main landmark, module renderer inside it', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('module-renderer'));
    expect(
      screen.getByTestId('landing-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('forwards the slug and tenant to LandingBreadcrumbs', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(screen.getByTestId('landing-breadcrumbs')).toHaveTextContent(
      'about-us:tenant-1',
    );
  });

  it('dispatches PageIntro with the page title', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(pageIntroMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headingBlock: mockLandingPage.headingBlock,
        locale: 'EN',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent('About Us');
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      {
        modules: [],
        locale: 'EN',
        tenant: 'tenant-1',
      },
      undefined,
    );
  });

  it('passes the fetched modules and locale through to ModuleRenderer when an editor has added some', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      {
        modules: [{ id: 'module-1', type: 'module_content' }],
        locale: 'EN',
        tenant: 'tenant-1',
      },
      undefined,
    );
    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });

  it('renders ModuleRenderer as a direct child of main, with no constrained wrapper around it', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    const moduleRenderer = screen.getByTestId('module-renderer');

    expect(moduleRenderer.parentElement).toBe(main);
  });

  it('dispatches PageIntro with the hero when a hero is set', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        hero: { id: 'hero-1', type: 'module_hero' },
      },
    });

    await setup();

    expect(pageIntroMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'EN',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent('hero-1');
  });

  it('forwards the resolved slug/tenant to getLandingPage', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us', 'tenant-1');
  });
});
