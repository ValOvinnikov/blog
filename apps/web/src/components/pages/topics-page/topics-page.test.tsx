import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { TopicsPage } from './topics-page';

const { getIndexPageMock, taxonomyListModuleMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  // `TaxonomyListModule` is an async Server Component — real RSC async-
  // component nesting isn't renderable through `@testing-library/react`'s
  // client renderer. Stubbed as a plain sync component so this suite can
  // assert `TopicsPage` passes the right props through without needing a
  // real async render; its own fetch/render logic is covered by
  // `taxonomy-list-module.test.tsx`.
  taxonomyListModuleMock: vi.fn(
    ({
      id,
      accessibleTitle,
      emptyMessage,
      buildHref,
      formatPostCount,
    }: {
      id: string;
      accessibleTitle: string;
      emptyMessage: string;
      buildHref: (slug: string) => string;
      formatPostCount: (count: number) => string;
    }) => (
      <div data-testid="taxonomy-list-module-stub">
        {id}:{accessibleTitle}:{emptyMessage}:{buildHref('engineering')}:
        {formatPostCount(5)}
      </div>
    ),
  ),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topicIndex: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(TopicsPage, {});

describe(`<${TopicsPage.name}/>`, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    taxonomyListModuleMock.mockClear();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the h1 and supporting text from the fetched page document', async () => {
    getIndexPageMock.mockResolvedValue({
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

  it('passes the taxonomyListId, TOPICS kind, page heading as accessibleTitle, the empty-state copy, and the href/postcount builders through to TaxonomyListModule', async () => {
    getIndexPageMock.mockResolvedValue({
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
        taxonomy: 'TOPICS',
        accessibleTitle: 'Topics',
        emptyMessage: 'No topics yet.',
      }),
      undefined,
    );
    expect(screen.getByTestId('taxonomy-list-module-stub')).toHaveTextContent(
      'topic-list-1:Topics:No topics yet.:/topics/engineering:5 posts',
    );
  });

  it('renders the Home › Topics breadcrumbs trail', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Topics');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        supportingText: 'Browse every post by topic.',
        seo: {},
        taxonomyListId: 'topic-list-1',
      },
    });

    const { container } = await setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
    expect(breadcrumbScript?.textContent).toContain(
      '"item":"https://example.com/topics"',
    );
  });
});
