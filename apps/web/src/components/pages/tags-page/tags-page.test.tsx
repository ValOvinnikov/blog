import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { TagsPage } from './tags-page';

const { getTagsIndexPageMock, taxonomyListModuleMock } = vi.hoisted(() => ({
  getTagsIndexPageMock: vi.fn(),
  // `TaxonomyListModule` is an async Server Component — real RSC async-
  // component nesting isn't renderable through `@testing-library/react`'s
  // client renderer. Stubbed as a plain sync component so this suite can
  // assert `TagsPage` passes the right props through without needing a
  // real async render; its own fetch/render logic is covered by
  // `taxonomy-list-module.test.tsx`.
  taxonomyListModuleMock: vi.fn(
    ({
      id,
      slot,
    }: {
      id: string;
      slot: {
        fallbackTaxonomy: string;
        accessibleTitle: string;
        emptyMessage: string;
      };
    }) => (
      <div data-testid="taxonomy-list-module-stub">
        {id}:{slot.fallbackTaxonomy}:{slot.accessibleTitle}:{slot.emptyMessage}
      </div>
    ),
  ),
}));

vi.mock('@web/server/tags-index/get-tags-index-page', () => ({
  getTagsIndexPage: getTagsIndexPageMock,
}));

vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));

vi.mock('@web/components/features/tags-index/tags-index-breadcrumbs', () => ({
  TagsIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
    <div data-testid="tags-index-breadcrumbs">{tenant}</div>
  ),
}));

const setup = customRenderAsync(TagsPage, { tenant: 'tenant-1' });

describe(TagsPage, () => {
  beforeEach(() => {
    getTagsIndexPageMock.mockReset();
    taxonomyListModuleMock.mockClear();
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

  it('renders the h1 and supporting text from the fetched page document', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tags' }),
    ).toBeVisible();
    expect(screen.getByText('Browse every post by tag.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, then the taxonomy list', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'tags-index-breadcrumbs',
      'taxonomy-list-module-stub',
    ]);
  });

  it('passes the taxonomyListId, TAGS fallback kind, page heading as accessibleTitle, and the empty-state copy through to TaxonomyListModule', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    await setup();

    expect(taxonomyListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tag-list-1',
        slot: expect.objectContaining({
          fallbackTaxonomy: 'TAGS',
          titleId: 'tag-list-title',
          dataTestId: 'taxonomy-list-module-tag-list-1',
          headingLevel: 2,
          accessibleTitle: 'Tags',
          emptyMessage: 'No tags yet.',
        }),
      }),
      undefined,
    );
    expect(screen.getByTestId('taxonomy-list-module-stub')).toHaveTextContent(
      'tag-list-1:TAGS:Tags:No tags yet.',
    );
  });

  it('forwards the tenant to getTagsIndexPage and TagsIndexBreadcrumbs', async () => {
    getTagsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    await setup();

    expect(getTagsIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('tags-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
