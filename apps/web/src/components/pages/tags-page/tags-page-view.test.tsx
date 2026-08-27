import { customRender, screen, within } from '@web/testing/custom-render';
import { makeTagsPageView } from '@web/testing/pages/tags-page/fixtures';

import { TagsPageView } from './tags-page-view';

const setup = customRender(TagsPageView, makeTagsPageView());

describe(TagsPageView, () => {
  it('renders the heading and supporting text', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tags' }),
    ).toBeVisible();
    expect(screen.getByText('Browse every post by tag.')).toBeVisible();
  });

  it('renders no supporting text paragraph when none is given', () => {
    setup({ supportingText: undefined });

    expect(
      screen.queryByText('Browse every post by tag.'),
    ).not.toBeInTheDocument();
  });

  it('renders the Home › Tags breadcrumbs trail', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Tags');
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

  it('renders the real composed taxonomy list markup — cards linking to each tag', () => {
    setup();

    const main = screen.getByRole('main');

    expect(
      within(main).getByRole('link', { name: /TypeScript/ }),
    ).toHaveAttribute('href', '/tags/typescript');
    expect(within(main).getByText('5 posts')).toBeVisible();
  });

  it('renders the given taxonomyListContent as a direct child of main', () => {
    setup({ taxonomyListContent: <div data-testid="taxonomy-content-stub" /> });

    const main = screen.getByRole('main');

    expect(
      within(main).getByTestId('taxonomy-content-stub'),
    ).toBeInTheDocument();
  });
});
