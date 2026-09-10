import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { notFound } from 'next/navigation';

import { TagsPage } from './tags-page';

const { getTagsIndexPageMock, moduleRendererMock, heroSlotMock } = vi.hoisted(
  () => ({
    getTagsIndexPageMock: vi.fn(),
    heroSlotMock: vi.fn(({ id }: { id: string }) => (
      <h1 data-testid="hero-slot">{id}</h1>
    )),
    // `ModuleRenderer` is an async Server Component — real RSC
    // async-component nesting isn't renderable through
    // `@testing-library/react`'s client renderer. Stubbed as a plain sync
    // component so this suite can assert `TagsPage` composes it with the
    // right props; its own dispatch logic — including resolving a
    // `module_taxonomyList` entry — is covered by its own test file
    // (`module-renderer.test.tsx`).
    moduleRendererMock: vi.fn(
      ({ modules }: { modules: { id: string; type: string }[] }) => (
        <div data-testid="module-renderer-stub">
          {modules.map((module) => module.type).join(',')}
        </div>
      ),
    ),
  }),
);

vi.mock('@web/server/tags-index/get-tags-index-page', () => ({
  getTagsIndexPage: getTagsIndexPageMock,
}));

vi.mock('@web/components/features/tags-index/tags-index-breadcrumbs', () => ({
  TagsIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="tags-index-breadcrumbs">{tenant}</div>
  ),
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRenderAsync(TagsPage, {
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TagsPage.name}/>`, () => {
  beforeEach(() => {
    getTagsIndexPageMock.mockReset();
    moduleRendererMock.mockClear();
    heroSlotMock.mockClear();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagsIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagsIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 from the fetched headingBlock when there is no hero', async () => {
    getTagsIndexPageMock.mockResolvedValue({
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

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tags' }),
    ).toBeVisible();
    expect(screen.getByText('Browse every post by tag.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [],
      },
    });

    await setup();

    expect(heroSlotMock).toHaveBeenCalledWith(
      { id: 'hero-1', type: 'module_hero', locale: 'en', tenant: 'tenant-1' },
      undefined,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders the parts in order: breadcrumbs, then the module renderer', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [{ id: 'tag-list-1', type: 'module_taxonomyList' }],
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['tags-index-breadcrumbs', 'module-renderer-stub']);
  });

  it('renders through PageShell: breadcrumbs outside main, module renderer inside it', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('module-renderer-stub'));
    expect(
      screen.getByTestId('tags-index-breadcrumbs').closest('main'),
    ).toBeNull();
  });

  it('passes the page-builder modules through to ModuleRenderer, in order, including the taxonomy list module', async () => {
    getTagsIndexPageMock.mockResolvedValue({
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

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [
          { id: 'tag-list-1', type: 'module_taxonomyList' },
          { id: 'newsletter-1', type: 'module_newsletter' },
        ],
        locale: 'en',
      }),
      undefined,
    );
    expect(screen.getByTestId('module-renderer-stub')).toHaveTextContent(
      'module_taxonomyList,module_newsletter',
    );
  });

  it('forwards the tenant to getTagsIndexPage and TagsIndexBreadcrumbs', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Tags' }),
        modules: [],
      },
    });

    await setup();

    expect(getTagsIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('tags-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
