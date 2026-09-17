import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

const { getLandingPageMock, landingModuleRendererMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
  landingModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string }[];
    }) => (
      <div data-testid="landing-module-renderer">
        {hero ? hero.id : headingBlock.heading} — {modules.length} modules
      </div>
    ),
  ),
}));

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

vi.mock('./landing-module-renderer', () => ({
  LandingModuleRenderer: landingModuleRendererMock,
}));

const setup = customRenderAsync(LandingPage, {
  slug: 'about-us',
  locale: 'EN',
  tenant: 'tenant-1',
});

describe(`<${LandingPage.name}/>`, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    landingModuleRendererMock.mockClear();
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

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['landing-breadcrumbs', 'landing-module-renderer']);
  });

  it('renders through PageShell: breadcrumbs outside the main landmark, module renderer inside it', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByTestId('landing-module-renderer'),
    );
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

  it('dispatches LandingModuleRenderer with the fetched hero, heading, and modules', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    expect(landingModuleRendererMock).toHaveBeenCalledWith(
      {
        hero: { id: 'hero-1', type: 'module_hero' },
        headingBlock: mockLandingPage.headingBlock,
        modules: [{ id: 'module-1', type: 'module_content' }],
        locale: 'EN',
        tenant: 'tenant-1',
      },
      undefined,
    );
    expect(screen.getByTestId('landing-module-renderer')).toHaveTextContent(
      'hero-1 — 1 modules',
    );
  });

  it('dispatches LandingModuleRenderer with no hero when the page has none', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(landingModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ hero: undefined }),
      undefined,
    );
    expect(screen.getByTestId('landing-module-renderer')).toHaveTextContent(
      'About Us — 0 modules',
    );
  });

  it('forwards the resolved slug/tenant to getLandingPage', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us', 'tenant-1');
  });
});
