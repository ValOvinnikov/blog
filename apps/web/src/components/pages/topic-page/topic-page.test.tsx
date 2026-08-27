import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import {
  makeTopic,
  makeTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { TopicPage } from './topic-page';

const {
  getTopicPageMock,
  getTopicsMock,
  moduleRendererMock,
  postListModuleMock,
} = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTopicsMock: vi.fn(),
  // `ModuleRenderer`/`PostListModule` are async Server Components — real
  // RSC async-component nesting isn't renderable through
  // `@testing-library/react`'s client renderer. Stubbed as plain sync
  // components so this suite can assert `TopicPage` passes the right props
  // through without needing a real async render; their own dispatch logic
  // is covered by `module-renderer.test.tsx` and
  // `post-list-module.test.tsx`. `TopicPageView`'s own rendering (h1,
  // breadcrumbs, JSON-LD, topic chips, composed posts markup) is covered by
  // `topic-page-view.test.tsx`.
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
      topic: { v1: { getTopicPage: getTopicPageMock } },
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

const topic = makeTopic({
  title: 'News',
  slug: 'news',
  description: 'The latest updates.',
});

const setup = customRenderAsync(TopicPage, { slug: 'news', locale: 'en' });

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    getTopicsMock.mockReset();
    moduleRendererMock.mockClear();
    postListModuleMock.mockClear();
    getTopicsMock.mockResolvedValue({
      ok: true,
      data: [
        makeTopicWithPostCount({ title: 'News', slug: 'news', postCount: 1 }),
        makeTopicWithPostCount({
          id: 'topic-2',
          title: 'Design',
          slug: 'design',
          postCount: 2,
        }),
      ],
    });
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('topic_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the topic simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 and supporting text from the referenced blog_topic, not page_topic.title', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.getByText('The latest updates.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('passes the postList id, locale, page, and topic-scoped copy through to PostListModule', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup({ page: 2 });

    expect(postListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'post-list-1',
        locale: 'en',
        page: 2,
        ariaLabel: 'News pages',
        accessibleTitle: 'Posts in News',
        emptyMessageFallback: 'No posts in News yet.',
        titleId: 'topic-posts-title',
      }),
      undefined,
    );

    const call = postListModuleMock.mock.calls[0];
    if (!call) throw new Error('PostListModule was not called');
    const { createHref } = call[0];
    expect(createHref(1)).toBe('/topics/news');
    expect(createHref(3)).toBe('/topics/news/page/3');
  });

  it('defaults to page 1 when no page is given', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(postListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
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

  it('renders the topic chip row with the current topic highlighted', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Design' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the Home › Topic breadcrumbs trail', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('News');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
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
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
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
      '"item":"https://example.com/topics/news"',
    );
  });
});
