import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { TopicsPage } from './topics-page';

const { getTopicsIndexPageMock, moduleRendererMock, heroSlotMock } = vi.hoisted(
  () => ({
    getTopicsIndexPageMock: vi.fn(),
    heroSlotMock: vi.fn(({ id }: { id: string }) => (
      <h1 data-testid="hero-slot">{id}</h1>
    )),
    // `ModuleRenderer` is an async Server Component — real RSC
    // async-component nesting isn't renderable through
    // `@testing-library/react`'s client renderer. Stubbed as a plain sync
    // component so this suite can assert `TopicsPage` composes it with the
    // right props; its own dispatch logic — including resolving a
    // `module_taxonomyList` entry — is covered by its own test file
    // (`module-renderer.test.tsx`).
    moduleRendererMock: vi.fn(
      ({ modules }: { modules: { id: string; type: string }[] }) => (
        <div data-testid="module-renderer-stub">
          {modules.map((module) => module.type).join(',')}
        </div>
      ),
    ),
  }),
);

vi.mock('@web/server/topics-index/get-topics-index-page', () => ({
  getTopicsIndexPage: getTopicsIndexPageMock,
}));

vi.mock(
  '@web/components/features/topics-index/topics-index-breadcrumbs',
  () => ({
    TopicsIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
      <div data-testid="topics-index-breadcrumbs">{tenant}</div>
    ),
  }),
);

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRenderAsync(TopicsPage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TopicsPage.name}/>`, () => {
  beforeEach(() => {
    getTopicsIndexPageMock.mockReset();
    moduleRendererMock.mockClear();
    heroSlotMock.mockClear();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicsIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicsIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 from the fetched headingBlock when there is no hero', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({
          heading: 'Topics',
          supportingText: 'Browse every post by topic.',
        }),
        modules: [],
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Topics' }),
    ).toBeVisible();
    expect(screen.getByText('Browse every post by topic.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(heroSlotMock).toHaveBeenCalledWith(
      { id: 'hero-1', type: 'module_hero', locale: 'en', tenant: 'tenant-1' },
      undefined,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [{ id: 'topic-list-1', type: 'module_taxonomyList' }],
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['topics-index-breadcrumbs', 'module-renderer-stub']);
  });

  it('renders through PageShell: breadcrumbs outside main, module renderer inside it', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('module-renderer-stub'));
    expect(
      screen.getByTestId('topics-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the page-builder modules through to ModuleRenderer, in order, including the taxonomy list module', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [
          { id: 'topic-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'topic-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('module-renderer-stub')).toHaveTextContent(
      'module_taxonomyList,module_newsletter',
    );
  });

  it('forwards the tenant to getTopicsIndexPage and TopicsIndexBreadcrumbs', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    expect(getTopicsIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('topics-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
