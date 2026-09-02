import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { TagsPage } from './tags-page';

const {
  getIndexPageMock,
  taxonomyListModuleMock,
  getTenantSanityContextMock,
  getTenantBaseUrlMock,
} = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  // `TaxonomyListModule` is an async Server Component — real RSC async-
  // component nesting isn't renderable through `@testing-library/react`'s
  // client renderer. Stubbed as a plain sync component so this suite can
  // assert `TagsPage` passes the right props through without needing a
  // real async render; its own fetch/render logic is covered by
  // `taxonomy-list-module.test.tsx`. `TagsPageView`'s own rendering (h1,
  // breadcrumbs, JSON-LD, composed content) is covered by
  // `tags-page-view.test.tsx`.
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
        {id}:{accessibleTitle}:{emptyMessage}:{buildHref('typescript')}:
        {formatPostCount(5)}
      </div>
    ),
  ),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tagIndex: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
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

const setup = customRenderAsync(TagsPage, {});

describe(`<${TagsPage.name}/>`, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    taxonomyListModuleMock.mockClear();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
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

  it('calls notFound() without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the h1 and supporting text from the fetched page document', async () => {
    getIndexPageMock.mockResolvedValue({
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

  it('passes the taxonomyListId, TAGS kind, page heading as accessibleTitle, the empty-state copy, and the href/postcount builders through to TaxonomyListModule', async () => {
    getIndexPageMock.mockResolvedValue({
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
        taxonomy: 'TAGS',
        accessibleTitle: 'Tags',
        emptyMessage: 'No tags yet.',
      }),
      undefined,
    );
    expect(screen.getByTestId('taxonomy-list-module-stub')).toHaveTextContent(
      'tag-list-1:Tags:No tags yet.:/tags/typescript:5 posts',
    );
  });

  it('renders the Home › Tags breadcrumbs trail', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Tags');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
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
      '"item":"https://example.com/tags"',
    );
  });

  it('forwards the resolved tenant Sanity context to getIndexPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        supportingText: 'Browse every post by tag.',
        seo: {},
        taxonomyListId: 'tag-list-1',
      },
    });

    await setup();

    expect(getIndexPageMock).toHaveBeenCalledWith(tenant);
  });
});
