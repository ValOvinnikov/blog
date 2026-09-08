import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { TopicsPage } from './topics-page';

const { getTopicsIndexPageMock, taxonomyListModuleMock } = vi.hoisted(() => ({
  getTopicsIndexPageMock: vi.fn(),
  // `TaxonomyListModule` is an async Server Component — real RSC async-
  // component nesting isn't renderable through `@testing-library/react`'s
  // client renderer. Stubbed as a plain sync component so this suite can
  // assert `TopicsPage` passes the right props through without needing a
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

vi.mock('@web/server/topics-index/get-topics-index-page', () => ({
  getTopicsIndexPage: getTopicsIndexPageMock,
}));

vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));

vi.mock(
  '@web/components/features/topics-index/topics-index-breadcrumbs',
  () => ({
    TopicsIndexBreadcrumbs: ({ tenant }: { tenant: string }) => (
      <div data-testid="topics-index-breadcrumbs">{tenant}</div>
    ),
  }),
);

const setup = customRenderAsync(TopicsPage, { tenant: 'tenant-1' });

describe(TopicsPage, () => {
  beforeEach(() => {
    getTopicsIndexPageMock.mockReset();
    taxonomyListModuleMock.mockClear();
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

  it('renders the h1 and supporting text from the fetched page document', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Topics' }),
    ).toBeVisible();
    expect(screen.getByText('Browse every post by topic.')).toBeVisible();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the parts in order: breadcrumbs, then the taxonomy list', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'topics-index-breadcrumbs',
      'taxonomy-list-module-stub',
    ]);
  });

  it('passes the taxonomyListId, TOPICS fallback kind, page heading as accessibleTitle, and the empty-state copy through to TaxonomyListModule', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    await setup();

    expect(taxonomyListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'topic-list-1',
        slot: expect.objectContaining({
          fallbackTaxonomy: 'TOPICS',
          titleId: 'topic-list-title',
          dataTestId: 'taxonomy-list-module-topic-list-1',
          headingLevel: 2,
          accessibleTitle: 'Topics',
          emptyMessage: 'No topics yet.',
        }),
      }),
      undefined,
    );
    expect(screen.getByTestId('taxonomy-list-module-stub')).toHaveTextContent(
      'topic-list-1:TOPICS:Topics:No topics yet.',
    );
  });

  it('forwards the tenant to getTopicsIndexPage and TopicsIndexBreadcrumbs', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    await setup();

    expect(getTopicsIndexPageMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByTestId('topics-index-breadcrumbs')).toHaveTextContent(
      'tenant-1',
    );
  });
});
