import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { BlogListPage } from './blog-list-page';

const {
  getIndexPageMock,
  getTopicsMock,
  moduleRendererMock,
  postListModuleMock,
  getTenantSanityContextMock,
  getTenantBaseUrlMock,
} = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getTopicsMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  // Both `ModuleRenderer` and `PostListModule` are async Server Components —
  // real RSC async-component nesting isn't renderable through
  // `@testing-library/react`'s client renderer. Stubbed as plain sync
  // components so this suite can assert `BlogListPage` passes the right
  // props through without needing a real async render; their own dispatch
  // logic is covered by `module-renderer.test.tsx` and
  // `post-list-module.test.tsx`. `BlogListPageView`'s own rendering (h1,
  // breadcrumbs, topic chips, JSON-LD) is covered by
  // `blog-list-page-view.test.tsx`.
  moduleRendererMock: vi.fn(
    ({ modules }: { modules: { id: string; type: string }[] }) => (
      <div data-testid="module-renderer-stub">
        {modules.map((module) => module.type).join(',')}
      </div>
    ),
  ),
  postListModuleMock: vi.fn(
    ({ id, page }: { id: string; locale: string; page: number }) => (
      <div data-testid="post-list-module-stub">
        {id}:{page}
      </div>
    ),
  ),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
    entities: {
      topics: { v1: { getTopics: getTopicsMock } },
    },
  },
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/post-list/post-list-module', () => ({
  PostListModule: postListModuleMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(BlogListPage, { page: 1, locale: 'en' });

describe(`<${BlogListPage.name}/>`, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    getTopicsMock.mockReset();
    moduleRendererMock.mockClear();
    postListModuleMock.mockClear();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    getTopicsMock.mockResolvedValue({
      ok: true,
      data: [
        makeTopicWithPostCount({
          title: 'News',
          slug: 'news',
          postCount: 1,
        }),
      ],
    });
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 from the fetched page shell', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        postListId: 'post-list-1',
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('passes the postList id, locale, and page through to PostListModule', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        postListId: 'post-list-1',
      },
    });

    await setup({ page: 2 });

    expect(postListModuleMock).toHaveBeenCalledWith(
      { id: 'post-list-1', locale: 'en', page: 2 },
      undefined,
    );
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        postListId: 'post-list-1',
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ modules: [], locale: 'en' }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer when an editor has added one via page_blog.modules', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        postListId: 'post-list-1',
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('module-renderer-stub')).toHaveTextContent(
      'module_newsletter',
    );
  });

  it('forwards the resolved tenant Sanity context to getIndexPage and getTopics', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        postListId: 'post-list-1',
      },
    });

    await setup();

    expect(getIndexPageMock).toHaveBeenCalledWith(tenant);
    expect(getTopicsMock).toHaveBeenCalledWith(tenant);
  });
});
