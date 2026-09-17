import { TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeTopic } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { TopicPage } from './topic-page';

const {
  getTopicPageMock,
  topicBreadcrumbsMock,
  topicChipsMock,
  topicModuleRendererMock,
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
  topicModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
      children,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string; type: string }[];
      children?: ReactNode;
    }) => (
      <div data-testid="topic-module-renderer">
        <span data-testid="page-intro">
          {hero ? hero.id : headingBlock.heading}
        </span>
        {children}
        <div data-testid="module-renderer-stub">
          {modules.map((module) => module.type).join(',')}
        </div>
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

vi.mock('./topic-module-renderer', () => ({
  TopicModuleRenderer: topicModuleRendererMock,
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
    topicModuleRendererMock.mockClear();
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

  it('dispatches TopicModuleRenderer with the view-model headingBlock', async () => {
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

    expect(topicModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headingBlock: makeHeadingBlock({
          heading: 'News',
          supportingText: 'The latest updates.',
        }),
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent('News');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, hero/heading, topic chips, module renderer', async () => {
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
      'topic-module-renderer',
      'page-intro',
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

  it('passes the current page and the topic archive scope as context to TopicModuleRenderer', async () => {
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

    expect(topicModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 3,
          archive: { kind: TAXONOMY_KIND.TOPICS, slug: 'news', name: 'News' },
        },
      }),
      undefined,
    );
  });

  it('defaults the TopicModuleRenderer context page to 1 when no page is given', async () => {
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

    expect(topicModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 1,
          archive: { kind: TAXONOMY_KIND.TOPICS, slug: 'news', name: 'News' },
        },
      }),
      undefined,
    );
  });

  it('passes the page-builder modules through to TopicModuleRenderer', async () => {
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

    expect(topicModuleRendererMock).toHaveBeenCalledWith(
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

  it('dispatches TopicModuleRenderer with the hero when a hero is set', async () => {
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

    expect(topicModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('page-intro')).toHaveTextContent('hero-1');
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
