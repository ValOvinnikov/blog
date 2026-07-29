import { customRenderAsync, screen, within } from '@web/testing/custom-render';

import { TopicsPage } from './topics-page';

const { getCategoriesMock } = vi.hoisted(() => ({
  getCategoriesMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      categories: { v1: { getCategories: getCategoriesMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
  Link: ({
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
    getCategoriesMock.mockReset();
  });

  it('renders the page heading', async () => {
    getCategoriesMock.mockResolvedValue({ ok: true, data: [] });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Topics' }),
    ).toBeVisible();
  });

  it('renders a card per category, linking to its category archive', async () => {
    getCategoriesMock.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'cat-1',
          title: 'Engineering',
          slug: 'engineering',
          description: 'Posts about building things.',
          postCount: 5,
        },
      ],
    });

    await setup();

    const link = screen.getByRole('link', { name: 'Engineering' });
    expect(link).toHaveAttribute('href', '/category/engineering');
    expect(screen.getByText('Posts about building things.')).toBeVisible();
    expect(screen.getByText('5 posts')).toBeVisible();
  });

  it('omits the description when the category has none', async () => {
    getCategoriesMock.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'cat-1',
          title: 'Engineering',
          slug: 'engineering',
          description: undefined,
          postCount: 5,
        },
      ],
    });

    await setup();

    expect(
      screen.queryByText('Posts about building things.'),
    ).not.toBeInTheDocument();
  });

  it('renders singular "1 post" for a category with exactly one post', async () => {
    getCategoriesMock.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'cat-1',
          title: 'Engineering',
          slug: 'engineering',
          description: undefined,
          postCount: 1,
        },
      ],
    });

    await setup();

    expect(screen.getByText('1 post')).toBeVisible();
  });

  it('renders an empty-state message when there are no categories', async () => {
    getCategoriesMock.mockResolvedValue({ ok: true, data: [] });

    await setup();

    expect(screen.getByText('No topics yet.')).toBeVisible();
    // Only the breadcrumb "Home" link renders — no category cards.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders the empty state instead of crashing when the fetch resolves to a failure result', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getCategoriesMock.mockResolvedValue({
      ok: false,
      error: new Error('Configuration must contain `projectId`'),
    });

    await setup();

    expect(screen.getByText('No topics yet.')).toBeVisible();
    // Only the breadcrumb "Home" link renders — no category cards.
    expect(screen.getAllByRole('link')).toHaveLength(1);

    errorSpy.mockRestore();
  });

  it('renders the Home › Topics breadcrumbs trail', async () => {
    getCategoriesMock.mockResolvedValue({ ok: true, data: [] });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Topics');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getCategoriesMock.mockResolvedValue({ ok: true, data: [] });

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
