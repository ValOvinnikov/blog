import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { PostIndexPage } from './post-index-page';

const { getPostIndexPageMock, postIndexModuleRendererMock } = vi.hoisted(
  () => ({
    getPostIndexPageMock: vi.fn(),
    postIndexModuleRendererMock: vi.fn(
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
        <div data-testid="post-index-module-renderer">
          {hero ? hero.id : headingBlock.heading} —{' '}
          {modules.map((module) => module.type).join(',')} — page{' '}
          {context?.page}
          {children}
        </div>
      ),
    ),
  }),
);

vi.mock('@web/server/post-index/get-post-index-page', () => ({
  getPostIndexPage: getPostIndexPageMock,
}));

vi.mock('@web/components/features/post-index/post-index-breadcrumbs', () => ({
  PostIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="post-index-breadcrumbs">{tenant}</div>
  ),
}));

vi.mock('@web/components/features/post-index/post-index-topic-chips', () => ({
  PostIndexTopicChips: ({ tenant }: { tenant: string }) => (
    <div data-testid="post-index-topic-chips">{tenant}</div>
  ),
}));

vi.mock('./post-index-module-renderer', () => ({
  PostIndexModuleRenderer: postIndexModuleRendererMock,
}));

const setup = customRenderAsync(PostIndexPage, {
  page: 1,
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('dispatches PostIndexModuleRenderer with the fetched page shell', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(postIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('post-index-module-renderer')).toHaveTextContent(
      'Blog',
    );
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, then the module renderer with the topic chips nested inside', async () => {
    getPostIndexPageMock.mockResolvedValue({
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
      'post-index-breadcrumbs',
      'post-index-module-renderer',
      'post-index-topic-chips',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside main, the module renderer inside it', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByTestId('post-index-module-renderer'),
    );
    expect(
      screen.getByTestId('post-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the current page as context to PostIndexModuleRenderer', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup({ page: 2 });

    expect(postIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ context: { page: 2 } }),
      undefined,
    );
  });

  it('passes an empty modules array to PostIndexModuleRenderer when the editor has not added any', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(postIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ modules: [], locale: 'en' }),
      undefined,
    );
  });

  it('passes the page-builder modules through to PostIndexModuleRenderer, including the post list module', async () => {
    getPostIndexPageMock.mockResolvedValue({
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

    expect(postIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'post-list-1', type: 'module_postList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('post-index-module-renderer')).toHaveTextContent(
      'module_postList,module_newsletter',
    );
  });

  it('dispatches PostIndexModuleRenderer with the hero when a hero is set', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(postIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('post-index-module-renderer')).toHaveTextContent(
      'hero-1',
    );
  });

  it('forwards the tenant to getPostIndexPage, PostIndexBreadcrumbs, and PostIndexTopicChips', async () => {
    getPostIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        modules: [],
      },
    });

    await setup();

    expect(getPostIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('post-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
    expect(screen.getByTestId('post-index-topic-chips')).toHaveTextContent(
      'tenant-1',
    );
  });
});
