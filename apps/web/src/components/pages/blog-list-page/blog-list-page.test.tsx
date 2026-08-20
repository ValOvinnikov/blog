import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import {
  makePostCard,
  makePostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { BlogListPage } from './blog-list-page';

const { getIndexPageMock, getTopicsMock, moduleRendererMock } = vi.hoisted(
  () => ({
    getIndexPageMock: vi.fn(),
    getTopicsMock: vi.fn(),
    // `ModuleRenderer` (and every module it dispatches to) is an async
    // Server Component — real RSC async-component nesting isn't
    // renderable through `@testing-library/react`'s client renderer (only
    // Next's own RSC pipeline supports it, the same reason the home route's
    // `page.tsx` composition has no test of its own). Stubbed as a plain
    // sync component so this suite can assert BlogListPage passes the
    // right `modules`/`locale` through without needing a real async render;
    // `ModuleRenderer`'s own dispatch logic is covered by
    // `module-renderer.test.tsx`.
    moduleRendererMock: vi.fn(
      ({ modules }: { modules: { id: string; type: string }[] }) => (
        <div data-testid="module-renderer-stub">
          {modules.map((module) => module.type).join(',')}
        </div>
      ),
    ),
  }),
);

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

const post = makePostCard({
  title: 'My Post Title',
  slug: 'my-post-slug',
  publishedAt: '2026-01-01T00:00:00.000Z',
  topic: makePostCardTopic(),
});

const setup = customRenderAsync(BlogListPage, { page: 1, locale: 'en' });

describe(`<${BlogListPage.name}/>`, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    getTopicsMock.mockReset();
    moduleRendererMock.mockClear();
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

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        posts: [post],
        modules: [],
        currentPage: 5,
        totalPages: 1,
        total: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
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

  it('renders the posts for a page within range', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(screen.getByText('Essays and notes.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the empty-state message when there are no posts', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'All posts' }),
    ).toBeVisible();
    expect(screen.getByText('No posts yet.')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'My Post Title' }),
    ).not.toBeInTheDocument();
  });

  it('renders pagination with the translated aria-label, previous, and next labels', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(
      screen.getByRole('navigation', { name: 'Blog pages' }),
    ).toBeVisible();
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/blog/page/3');
    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/blog');
  });

  it('renders the topic chip row', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/topics/news',
    );
  });

  it('renders the Home › Blog breadcrumbs trail', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Blog');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
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
      '"item":"https://example.com/blog"',
    );
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        modules: [],
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
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
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
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
});
