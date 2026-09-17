import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { TopicsPage } from './topics-page';

const { getTopicsIndexPageMock, topicsModuleRendererMock } = vi.hoisted(() => ({
  getTopicsIndexPageMock: vi.fn(),
  topicsModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string; type: string }[];
    }) => (
      <div data-testid="topics-module-renderer">
        {hero ? hero.id : headingBlock.heading} —{' '}
        {modules.map((module) => module.type).join(',')}
      </div>
    ),
  ),
}));

vi.mock('@web/server/topics-index/get-topics-index-page', () => ({
  getTopicsIndexPage: getTopicsIndexPageMock,
}));

vi.mock(
  '@web/components/features/topics-index/topics-index-breadcrumbs',
  () => ({
    TopicsIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
      <div data-testid="topics-index-breadcrumbs">{tenant}</div>
    ),
  }),
);

vi.mock('./topics-module-renderer', () => ({
  TopicsModuleRenderer: topicsModuleRendererMock,
}));

const setup = customRenderAsync(TopicsPage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TopicsPage.name}/>`, () => {
  beforeEach(() => {
    getTopicsIndexPageMock.mockReset();
    topicsModuleRendererMock.mockClear();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicsIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicsIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('dispatches TopicsModuleRenderer with the fetched headingBlock and modules', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
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

    expect(topicsModuleRendererMock).toHaveBeenCalledWith(
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
    expect(screen.getByTestId('topics-module-renderer')).toHaveTextContent(
      'Topics',
    );
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('dispatches TopicsModuleRenderer with the hero when a hero is set', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(topicsModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('topics-module-renderer')).toHaveTextContent(
      'hero-1',
    );
  });

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
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
      'topics-index-breadcrumbs',
      'topics-module-renderer',
    ]);
  });

  it('renders through PageShell: the module renderer inside a single main landmark', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('topics-module-renderer'));
    expect(
      screen.getByTestId('topics-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the page-builder modules through to TopicsModuleRenderer, in order, including the taxonomy list module', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
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

    expect(topicsModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'topic-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('topics-module-renderer')).toHaveTextContent(
      'module_taxonomyList,module_newsletter',
    );
  });

  it('forwards the tenant to getTopicsIndexPage and TopicsIndexBreadcrumbs', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Topics' }),
        modules: [],
      },
    });

    await setup();

    expect(getTopicsIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('topics-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
