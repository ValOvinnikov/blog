import { TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

const { getTagPageMock, tagBreadcrumbsMock, moduleRendererMock, heroSlotMock } =
  vi.hoisted(() => ({
    getTagPageMock: vi.fn(),
    tagBreadcrumbsMock: vi.fn(
      ({ slug, tenant }: { slug: string; tenant: string }) => (
        <div data-testid="tag-breadcrumbs">
          {slug}:{tenant}
        </div>
      ),
    ),
    heroSlotMock: vi.fn(({ id }: { id: string }) => (
      <h1 data-testid="hero-slot">{id}</h1>
    )),
    // `ModuleRenderer` is an async Server Component — real RSC async-component
    // nesting isn't renderable through `@testing-library/react`'s client
    // renderer. Stubbed as a plain sync component so this suite can assert
    // `TagPage` composes it with the right props; its own behavior (and the
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

vi.mock('@web/server/tag/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

vi.mock('@web/components/features/tag/tag-breadcrumbs', () => ({
  TagBreadcrumbs: tagBreadcrumbsMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const tag = makeTag({
  title: 'TypeScript',
  slug: 'typescript',
  description: 'Posts about TypeScript.',
});

const setup = customRenderAsync(TagPage, {
  slug: 'typescript',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TagPage.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    tagBreadcrumbsMock.mockClear();
    moduleRendererMock.mockClear();
    heroSlotMock.mockClear();
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

  it('renders the h1 and supporting text from the view model headingBlock', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({
          heading: 'TypeScript',
          supportingText: 'Posts about TypeScript.',
        }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(screen.getByText('Posts about TypeScript.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, module renderer', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [{ id: 'newsletter-1', type: 'module_newsletter' }],
        seo: {},
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['tag-breadcrumbs', 'module-renderer-stub']);
  });

  it('renders through PageShell: breadcrumbs outside main, everything else inside it', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('module-renderer-stub'));
    expect(screen.getByTestId('tag-breadcrumbs').closest('main')).toBeNull();
  });

  it('passes the current page and the tag archive scope as context to ModuleRenderer', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [],
        seo: {},
      },
    });

    await setup({ page: 3 });

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 3,
          archive: {
            kind: TAXONOMY_KIND.TAGS,
            slug: 'typescript',
            name: 'TypeScript',
          },
        },
      }),
      undefined,
    );
  });

  it('defaults the ModuleRenderer context page to 1 when no page is given', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          page: 1,
          archive: {
            kind: TAXONOMY_KIND.TAGS,
            slug: 'typescript',
            name: 'TypeScript',
          },
        },
      }),
      undefined,
    );
  });

  it('passes the page-builder modules through to ModuleRenderer', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
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
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('dispatches the hero through HeroSlot and keeps exactly one h1 when a hero is set', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
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

  it('forwards the slug and tenant to getTagPage and TagBreadcrumbs', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
        modules: [],
        seo: {},
      },
    });

    await setup();

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', 'tenant-1');
    expect(screen.getByTestId('tag-breadcrumbs')).toHaveTextContent(
      'typescript:tenant-1',
    );
  });
});
