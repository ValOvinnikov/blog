import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

const { getLandingPageMock, moduleRendererMock, heroSlotMock } = vi.hoisted(
  () => ({
    getLandingPageMock: vi.fn(),
    // `ModuleRenderer`/`HeroSlot` are async Server Components — real RSC
    // async-component nesting isn't renderable through
    // `@testing-library/react`'s client renderer (`blog-post-page.test.tsx`
    // follows the same pattern). Each is stubbed as a plain sync component
    // so this suite can assert `LandingPage` passes the right props through
    // without needing a real async render; their own dispatch logic is
    // covered by `module-renderer.test.tsx`/`hero-slot.test.tsx`.
    moduleRendererMock: vi.fn(({ modules }: { modules: { id: string }[] }) => (
      <div data-testid="module-renderer">{modules.length} modules</div>
    )),
    heroSlotMock: vi.fn(({ id }: { id: string }) => (
      <h1 data-testid="hero-slot">{id}</h1>
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

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRenderAsync(LandingPage, {
  slug: 'about-us',
  locale: 'EN',
  tenant: 'tenant-1',
});

describe(LandingPage, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    moduleRendererMock.mockClear();
    heroSlotMock.mockClear();
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

    expect(order).toEqual(['landing-breadcrumbs', 'module-renderer']);
  });

  it('forwards the slug and tenant to LandingBreadcrumbs', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(screen.getByTestId('landing-breadcrumbs')).toHaveTextContent(
      'about-us:tenant-1',
    );
  });

  it('renders the page title as the h1', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'About Us' }),
    ).toBeInTheDocument();
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      { modules: [], locale: 'EN', tenant: 'tenant-1' },
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

  it('renders the page title as the only h1 when no hero is set', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        hero: { id: 'hero-1', type: 'module_hero' },
      },
    });

    await setup();

    expect(heroSlotMock).toHaveBeenCalledWith(
      {
        id: 'hero-1',
        type: 'module_hero',
        locale: 'EN',
        tenant: 'tenant-1',
      },
      undefined,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('forwards the resolved slug/tenant to getLandingPage', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us', 'tenant-1');
  });
});
