import { TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeTopic } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { TopicPage } from './topic-page';

const {
  getTopicPageMock,
  topicBreadcrumbsMock,
  topicChipsMock,
  moduleRendererMock,
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
  // `ModuleRenderer` is an async Server Component — real RSC async-component
  // nesting isn't renderable through `@testing-library/react`'s client
  // renderer. Stubbed as a plain sync component so this suite can assert
  // `TopicPage` composes it with the right props; its own behavior (and the
  // post-list module it renders) is covered by `module-renderer.test.tsx`
  // and `post-list-module.test.tsx`.
  moduleRendererMock: vi.fn(
    ({ modules }: { modules: { id: string; type: string }[] }) => (
      <div data-testid="module-renderer-stub">
        {modules.map((module) => module.type).join(',')}
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

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    topicBreadcrumbsMock.mockClear();
    topicChipsMock.mockClear();
    moduleRendererMock.mockClear();
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

  it('renders the h1 and supporting text from the view model headingBlock', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({
          heading: 'News',
          supportingText: 'The latest updates.',
        }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.getByText('The latest updates.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, topic chips, module renderer', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        seo: {},
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'topic-breadcrumbs',
      'topic-chips',
      'module-renderer-stub',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside main, everything else inside it', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('topic-chips'));
    expect(main).toContainElement(screen.getByTestId('module-renderer-stub'));
    expect(screen.getByTestId('topic-breadcrumbs').closest('main')).toBeNull();
  });

  it('passes the current page and the topic archive scope as context to ModuleRenderer', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [],
        seo: {},
      },
    });

    await setup({ page: 3 });

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 3,
          archive: { kind: TAXONOMY_KIND.TOPICS, slug: 'news', name: 'News' },
        },
      }),
      undefined,
    );
  });

  it('defaults the ModuleRenderer context page to 1 when no page is given', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 1,
          archive: { kind: TAXONOMY_KIND.TOPICS, slug: 'news', name: 'News' },
        },
      }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        seo: {},
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

  it('renders the view-model headingBlock heading as the only h1 when no hero is set', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [],
        seo: {},
      },
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
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
        seo: {},
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
      data: {
        topic,
        headingBlock: makeHeadingBlock({ heading: 'News' }),
        modules: [],
        seo: {},
      },
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
