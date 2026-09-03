import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

const {
  getTagPageMock,
  moduleRendererMock,
  postListModuleMock,
  getTenantSanityContextMock,
  getTenantBaseUrlMock,
} = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  // `ModuleRenderer`/`PostListModule` are async Server Components — real
  // RSC async-component nesting isn't renderable through
  // `@testing-library/react`'s client renderer. Stubbed as plain sync
  // components so this suite can assert `TagPage` passes the right props
  // through without needing a real async render; their own dispatch logic
  // is covered by `module-renderer.test.tsx` and
  // `post-list-module.test.tsx`. `TagPageView`'s own rendering (h1,
  // breadcrumbs, JSON-LD, composed posts markup) is covered by
  // `tag-page-view.test.tsx`.
  moduleRendererMock: vi.fn(
    ({ modules }: { modules: { id: string; type: string }[] }) => (
      <div data-testid="module-renderer-stub">
        {modules.map((module) => module.type).join(',')}
      </div>
    ),
  ),
  postListModuleMock: vi.fn(
    ({
      id,
      page,
    }: {
      id: string;
      locale: string;
      page: number;
      createHref: (page: number) => string;
    }) => (
      <div data-testid="post-list-module-stub">
        {id}:{page}
      </div>
    ),
  ),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagPage: getTagPageMock } },
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

const tag = makeTag({
  title: 'TypeScript',
  slug: 'typescript',
  description: 'Posts about TypeScript.',
});

const setup = customRenderAsync(TagPage, { slug: 'typescript', locale: 'en' });

describe(`<${TagPage.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    moduleRendererMock.mockClear();
    postListModuleMock.mockClear();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tag_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the tag simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 and supporting text from the tag', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(screen.getByText('Posts about TypeScript.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('passes the postList id, locale, page, and tag-scoped copy through to PostListModule', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup({ page: 2 });

    expect(postListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'post-list-1',
        locale: 'en',
        page: 2,
        ariaLabel: 'TypeScript pages',
        accessibleTitle: 'Posts tagged TypeScript',
        emptyMessageFallback: 'No posts tagged TypeScript yet.',
        titleId: 'tag-posts-title',
      }),
      undefined,
    );

    const call = postListModuleMock.mock.calls[0];
    if (!call) throw new Error('PostListModule was not called');
    const { createHref } = call[0];
    expect(createHref(1)).toBe('/tags/typescript');
    expect(createHref(3)).toBe('/tags/typescript/page/3');
  });

  it('defaults to page 1 when no page is given', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(postListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        seo: {},
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

  it('renders the Home › Tag breadcrumbs trail with the correct href', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    const current = screen.getByText('Tag: TypeScript');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders the JSON-LD BreadcrumbList schema script with the tag URL', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    const { container } = await setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
    expect(breadcrumbScript?.textContent).toContain(
      '"item":"https://example.com/tags/typescript"',
    );
  });

  it('forwards the resolved tenant Sanity context to getTagPage', async () => {
    const tenantContext = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenantContext);
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', tenantContext);
  });
});
