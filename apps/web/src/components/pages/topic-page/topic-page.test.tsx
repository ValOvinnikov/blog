import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTopic } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { TopicPage } from './topic-page';

const {
  getTopicPageMock,
  topicBreadcrumbsMock,
  topicChipsMock,
  moduleRendererMock,
  postListModuleMock,
  heroSlotMock,
} = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  topicBreadcrumbsMock: vi.fn(
    ({ slug, tenant }: { slug: string; tenant: string }) => (
      <div data-testid="topic-breadcrumbs">
        {slug}:{tenant}
      </div>
    ),
  ),
  topicChipsMock: vi.fn(
    ({ activeSlug, tenant }: { activeSlug: string; tenant: string }) => (
      <div data-testid="topic-chips">
        {activeSlug}:{tenant}
      </div>
    ),
  ),
  heroSlotMock: vi.fn(({ id }: { id: string }) => (
    <h1 data-testid="hero-slot">{id}</h1>
  )),
  // `PostListModule`/`ModuleRenderer` are async Server Components — real
  // RSC async-component nesting isn't renderable through
  // `@testing-library/react`'s client renderer. Stubbed as plain sync
  // components so this suite can assert `TopicPage` composes them in the
  // right order with the right props; each part's own behavior is covered
  // by its own test file (`module-renderer.test.tsx`,
  // `post-list-module.test.tsx`, `topic-breadcrumbs.test.tsx`,
  // `topic-chips.test.tsx`).
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

vi.mock('@web/server/topic/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/components/features/topic/topic-breadcrumbs', () => ({
  TopicBreadcrumbs: topicBreadcrumbsMock,
}));

vi.mock('@web/components/features/topic/topic-chips', () => ({
  TopicChips: topicChipsMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/post-list/post-list-module', () => ({
  PostListModule: postListModuleMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const topic = makeTopic({
  title: 'News',
  slug: 'news',
  description: 'The latest updates.',
});

const setup = customRenderAsync(TopicPage, {
  slug: 'news',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(TopicPage, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    topicBreadcrumbsMock.mockClear();
    topicChipsMock.mockClear();
    moduleRendererMock.mockClear();
    postListModuleMock.mockClear();
    heroSlotMock.mockClear();
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

  it('renders the parts in order: breadcrumbs, topic chips, post list, module renderer', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        seo: {},
        postListId: 'post-list-1',
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'topic-breadcrumbs',
      'topic-chips',
      'post-list-module-stub',
      'module-renderer-stub',
    ]);
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

  it('renders the referenced blog_topic heading as the only h1 when no hero is set', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
        seo: {},
        postListId: 'post-list-1',
      },
    });

    await setup();

    expect(heroSlotMock).toHaveBeenCalledWith(
      { id: 'hero-1', type: 'module_hero', locale: 'en', tenant: 'tenant-1' },
      undefined,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('forwards the slug and tenant to getTopicPage, TopicBreadcrumbs, and TopicChips', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(getTopicPageMock).toHaveBeenCalledWith('news', 'tenant-1');
    expect(screen.getByTestId('topic-breadcrumbs')).toHaveTextContent(
      'news:tenant-1',
    );
    expect(screen.getByTestId('topic-chips')).toHaveTextContent(
      'news:tenant-1',
    );
  });
});
