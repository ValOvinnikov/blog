import { customRender, screen, within } from '@web/testing/custom-render';
import { makeTopicPageView } from '@web/testing/pages/topic-page/fixtures';

import { TopicPageView } from './topic-page-view';

const setup = customRender(TopicPageView, makeTopicPageView());

describe(TopicPageView, () => {
  it('renders the heading and supporting text', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.getByText('The latest updates.')).toBeVisible();
  });

  it('renders no supporting text paragraph when none is given', () => {
    setup({ supportingText: undefined });

    expect(screen.queryByText('The latest updates.')).not.toBeInTheDocument();
  });

  it('renders the topic chip row with the current topic highlighted', () => {
    setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Design' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the Home › Topic breadcrumbs trail', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('News');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb trail as a sibling before <main>, not nested inside it', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it('renders the real composed posts archive markup — posts grid and pagination', () => {
    setup();

    const main = screen.getByRole('main');

    expect(
      within(main).getByRole('link', { name: 'First post' }),
    ).toHaveAttribute('href', '/blog/first-post');
    expect(
      within(main).getByRole('navigation', { name: 'News pages' }),
    ).toBeInTheDocument();
  });

  it('renders the given postsContent as a direct child of main', () => {
    setup({ postsContent: <div data-testid="posts-content-stub" /> });

    const main = screen.getByRole('main');

    expect(within(main).getByTestId('posts-content-stub')).toBeInTheDocument();
  });
});
