import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { TopicIndexPage } from './topic-index-page';

const { getTopicIndexPageMock, topicIndexModuleRendererMock } = vi.hoisted(
  () => ({
    getTopicIndexPageMock: vi.fn(),
    topicIndexModuleRendererMock: vi.fn(
      ({
        hero,
        headingBlock,
        modules,
      }: {
        hero?: { id: string };
        headingBlock: { heading: string };
        modules: { id: string; type: string }[];
      }) => (
        <div data-testid="topic-index-module-renderer">
          {hero ? hero.id : headingBlock.heading} —{' '}
          {modules.map((module) => module.type).join(',')}
        </div>
      ),
    ),
  }),
);

vi.mock('@web/server/topic-index/get-topic-index-page', () => ({
  getTopicIndexPage: getTopicIndexPageMock,
}));

vi.mock('@web/components/features/topic-index/topic-index-breadcrumbs', () => ({
  TopicIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="topic-index-breadcrumbs">{tenant}</div>
  ),
}));

vi.mock('./topic-index-module-renderer', () => ({
  TopicIndexModuleRenderer: topicIndexModuleRendererMock,
}));

const setup = customRenderAsync(TopicIndexPage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TopicIndexPage.name}/>`, () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('dispatches TopicIndexModuleRenderer with the fetched headingBlock and modules', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({
          heading: 'Topics',
          supportingText: 'Browse every post by topic.',
        }),
        modules: [],
      },
    });

    await setup();

    expect(topicIndexModuleRendererMock).toHaveBeenCalledWith(
      {
        hero: undefined,
        headingBlock: makeHeadingBlock({
          heading: 'Topics',
          supportingText: 'Browse every post by topic.',
        }),
        modules: [],
        locale: 'en',
        tenant: 'tenant-1',
      },
      undefined,
    );
    expect(screen.getByTestId('topic-index-module-renderer')).toHaveTextContent(
      'Topics',
    );
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('dispatches TopicIndexModuleRenderer with the hero when a hero is set', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(topicIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('topic-index-module-renderer')).toHaveTextContent(
      'hero-1',
    );
  });

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [{ id: 'topic-list-1', type: 'module_taxonomyList' }],
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'topic-index-breadcrumbs',
      'topic-index-module-renderer',
    ]);
  });

  it('renders through PageShell: the module renderer inside a single main landmark', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByTestId('topic-index-module-renderer'),
    );
    expect(
      screen.getByTestId('topic-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the page-builder modules through to TopicIndexModuleRenderer, in order, including the taxonomy list module', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [
          { id: 'topic-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
      },
    });

    await setup();

    expect(topicIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'topic-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('topic-index-module-renderer')).toHaveTextContent(
      'module_taxonomyList,module_newsletter',
    );
  });

  it('forwards the tenant to getTopicIndexPage and TopicIndexBreadcrumbs', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    expect(getTopicIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('topic-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
