import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { BlogListPage } from './blog-list-page';

const { getBlogListPageMock, moduleRendererMock, heroSlotMock } = vi.hoisted(
  () => ({
    getBlogListPageMock: vi.fn(),
    heroSlotMock: vi.fn(({ id }: { id: string }) => (
      <h1 data-testid="hero-slot">{id}</h1>
    )),
    // `ModuleRenderer` is an async Server Component — real RSC
    // async-component nesting isn't renderable through
    // `@testing-library/react`'s client renderer (`blog-post-page.test.tsx`
    // follows the same pattern). Stubbed as a plain sync component so this
    // suite can assert `BlogListPage` composes it with the right props; its
    // own dispatch logic — including resolving a `module_postList` entry —
    // is covered by its own test file (`module-renderer.test.tsx`).
    moduleRendererMock: vi.fn(
      ({ modules }: { modules: { id: string; type: string }[] }) => (
        <div data-testid="module-renderer-stub">
          {modules.map((module) => module.type).join(',')}
        </div>
      ),
    ),
  }),
);

vi.mock('@web/server/blog-list/get-blog-list-page', () => ({
  getBlogListPage: getBlogListPageMock,
}));

vi.mock('@web/components/features/blog-list/blog-list-breadcrumbs', () => ({
  BlogListBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="blog-list-breadcrumbs">{tenant}</div>
  ),
}));

vi.mock('@web/components/features/blog-list/blog-list-topic-chips', () => ({
  BlogListTopicChips: ({ tenant }: { tenant: string }) => (
    <div data-testid="blog-list-topic-chips">{tenant}</div>
  ),
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRenderAsync(BlogListPage, {
  page: 1,
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${BlogListPage.name}/>`, () => {
  beforeEach(() => {
    getBlogListPageMock.mockReset();
    moduleRendererMock.mockClear();
    heroSlotMock.mockClear();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getBlogListPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getBlogListPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 from the fetched page shell', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, topic chips, module renderer', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [
          { id: 'post-list-1', type: 'module_postList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'blog-list-breadcrumbs',
      'blog-list-topic-chips',
      'module-renderer-stub',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside main, everything else inside it', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('blog-list-topic-chips'));
    expect(main).toContainElement(screen.getByTestId('module-renderer-stub'));
    expect(
      screen.getByTestId('blog-list-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the current page as context to ModuleRenderer', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup({ page: 2 });

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ context: { page: 2 } }),
      undefined,
    );
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ modules: [], locale: 'en' }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer, including the post list module', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [
          { id: 'post-list-1', type: 'module_postList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'post-list-1', type: 'module_postList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('module-renderer-stub')).toHaveTextContent(
      'module_postList,module_newsletter',
    );
  });

  it('renders the fetched heading as the only h1 when no hero is set', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
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

  it('forwards the tenant to getBlogListPage, BlogListBreadcrumbs, and BlogListTopicChips', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(getBlogListPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('blog-list-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
    expect(screen.getByTestId('blog-list-topic-chips')).toHaveTextContent(
      'tenant-1',
    );
  });
});
