import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { TagIndexPage } from './tag-index-page';

const { getTagIndexPageMock, tagIndexModuleRendererMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
  tagIndexModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string; type: string }[];
    }) => (
      <div data-testid="tag-index-module-renderer">
        {hero ? hero.id : headingBlock.heading} —{' '}
        {modules.map((module) => module.type).join(',')}
      </div>
    ),
  ),
}));

vi.mock('@web/server/tag-index/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

vi.mock('@web/components/features/tag-index/tag-index-breadcrumbs', () => ({
  TagIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="tag-index-breadcrumbs">{tenant}</div>
  ),
}));

vi.mock('./tag-index-module-renderer', () => ({
  TagIndexModuleRenderer: tagIndexModuleRendererMock,
}));

const setup = customRenderAsync(TagIndexPage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TagIndexPage.name}/>`, () => {
  beforeEach(() => {
    getTagIndexPageMock.mockReset();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tag_index_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('dispatches TagIndexModuleRenderer with the fetched headingBlock and modules', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({
          heading: 'Tags',
          supportingText: 'Browse every post by tag.',
        }),
        modules: [],
      },
    });

    await setup();

    expect(tagIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headingBlock: makeHeadingBlock({
          heading: 'Tags',
          supportingText: 'Browse every post by tag.',
        }),
        modules: [],
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('tag-index-module-renderer')).toHaveTextContent(
      'Tags',
    );
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('dispatches TagIndexModuleRenderer with the hero when a hero is set', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(tagIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: { id: 'hero-1', type: 'module_hero' },
        locale: 'en',
        tenant: 'tenant-1',
      }),
      undefined,
    );
    expect(screen.getByTestId('tag-index-module-renderer')).toHaveTextContent(
      'hero-1',
    );
  });

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [{ id: 'tag-list-1', type: 'module_taxonomyList' }],
      },
    });

    await setup();

    const order = screen
      .getAllByTestId(/.+/)
      .map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'tag-index-breadcrumbs',
      'tag-index-module-renderer',
    ]);
  });

  it('renders through PageShell: breadcrumbs outside main, module renderer inside it', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByTestId('tag-index-module-renderer'),
    );
    expect(
      screen.getByTestId('tag-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the page-builder modules through to TagIndexModuleRenderer, in order, including the taxonomy list module', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [
          { id: 'tag-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
      },
    });

    await setup();

    expect(tagIndexModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'tag-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('tag-index-module-renderer')).toHaveTextContent(
      'module_taxonomyList,module_newsletter',
    );
  });

  it('forwards the tenant to getTagIndexPage and TagIndexBreadcrumbs', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [],
      },
    });

    await setup();

    expect(getTagIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('tag-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
