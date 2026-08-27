import { customRender, screen, within } from '@web/testing/custom-render';
import { makeBlogListPageView } from '@web/testing/pages/blog-list-page/fixtures';

import { BlogListPageView } from './blog-list-page-view';

const setup = customRender(BlogListPageView, makeBlogListPageView());

describe(BlogListPageView, () => {
  it('renders the h1 and supporting text', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(
      screen.getByText('Essays and notes on building this site.'),
    ).toBeVisible();
  });

  it('renders no supporting text paragraph when none is given', () => {
    setup({ supportingText: undefined });

    expect(
      screen.queryByText('Essays and notes on building this site.'),
    ).not.toBeInTheDocument();
  });

  it('renders the topic chip row from the given topics', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    expect(within(nav).getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      within(nav).getByRole('link', { name: 'Engineering' }),
    ).toHaveAttribute('href', '/topics/engineering');
  });

  it('renders no topic chip row when there are no topics', () => {
    setup({ topics: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders the breadcrumb trail as a sibling before <main>, not nested inside it', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Blog');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders the JSON-LD BreadcrumbList schema script when given one', () => {
    const { container } = setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
  });

  it('renders no JSON-LD script when no schema is given', () => {
    const { container } = setup({ breadcrumbListSchema: undefined });

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument();
  });

  it('renders the given postsContent inside <main>', () => {
    setup({ postsContent: <div data-testid="posts-content-stub" /> });

    expect(
      within(screen.getByRole('main')).getByTestId('posts-content-stub'),
    ).toBeInTheDocument();
  });

  it('renders the Pagination from the default fixture postsContent', () => {
    setup();

    expect(
      screen.getByRole('navigation', { name: 'Blog pages' }),
    ).toBeInTheDocument();
  });
});
