import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { BlogListPage } from './blog-list-page';

const { getBlogListPageMock, blogListModuleRendererMock } = vi.hoisted(() => ({
  getBlogListPageMock: vi.fn(),
  blogListModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
      context,
      children,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string; type: string }[];
      context?: { page: number };
      children?: ReactNode;
    }) => (
      <div data-testid="blog-list-module-renderer">
        {hero ? hero.id : headingBlock.heading} —{' '}
        {modules.map((module) => module.type).join(',')} — page {context?.page}
        {children}
      </div>
    ),
  ),
}));

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

vi.mock('./blog-list-module-renderer', () => ({
  BlogListModuleRenderer: blogListModuleRendererMock,
}));

const setup = customRenderAsync(BlogListPage, {
  page: 1,
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${BlogListPage.name}/>`, () => {
  beforeEach(() => {
    getBlogListPageMock.mockReset();
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

  it('dispatches BlogListModuleRenderer with the fetched page shell', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(blogListModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('blog-list-module-renderer')).toHaveTextContent(
      'Blog',
    );
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, then the module renderer with the topic chips nested inside', async () => {
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
      'blog-list-module-renderer',
      'blog-list-topic-chips',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside main, the module renderer inside it', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByTestId('blog-list-module-renderer'),
    );
    expect(
      screen.getByTestId('blog-list-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the current page as context to BlogListModuleRenderer', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup({ page: 2 });

    expect(blogListModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ context: { page: 2 } }),
      undefined,
    );
  });

  it('passes an empty modules array to BlogListModuleRenderer when the editor has not added any', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(blogListModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ modules: [], locale: 'en' }),
      undefined,
    );
  });

  it('passes the page-builder modules through to BlogListModuleRenderer, including the post list module', async () => {
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

    expect(blogListModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'post-list-1', type: 'module_postList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('blog-list-module-renderer')).toHaveTextContent(
      'module_postList,module_newsletter',
    );
  });

  it('dispatches BlogListModuleRenderer with the hero when a hero is set', async () => {
    getBlogListPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(blogListModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('blog-list-module-renderer')).toHaveTextContent(
      'hero-1',
    );
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
