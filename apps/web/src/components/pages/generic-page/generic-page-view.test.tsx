import { customRender, screen, within } from '@web/testing/custom-render';
import { makeGenericPageView } from '@web/testing/pages/generic-page/fixtures';

import { GenericPageView } from './generic-page-view';

const setup = customRender(GenericPageView, makeGenericPageView());

describe(GenericPageView, () => {
  it('renders the title as the h1', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'About Us' }),
    ).toBeVisible();
  });

  it('renders the Home › {title} breadcrumbs trail', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('About Us');
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

  it('renders the given modulesContent as a direct child of main, with no constrained wrapper around it', () => {
    setup({ modulesContent: <div data-testid="modules-content-stub" /> });

    const main = screen.getByRole('main');
    const modulesContent = screen.getByTestId('modules-content-stub');

    expect(modulesContent.parentElement).toBe(main);
  });
});
