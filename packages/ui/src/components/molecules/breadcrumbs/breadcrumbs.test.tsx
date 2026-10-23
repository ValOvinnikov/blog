import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { Breadcrumbs } from './breadcrumbs';

faker.seed(123);

const firstItem = { label: 'Home', href: '/' };
const middleItem = {
  label: faker.commerce.department(),
  href: `/topics/${faker.lorem.slug()}`,
};
const lastItem = {
  label: faker.lorem.sentence(4),
  href: `/blog/${faker.lorem.slug()}`,
};
const items = [firstItem, middleItem, lastItem];
const ariaLabel = 'Breadcrumb';

const setup = customRender(Breadcrumbs, { items, ariaLabel });

describe(`<${Breadcrumbs.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a nav landmark with the passed ariaLabel', () => {
      expect(screen.getByRole('navigation', { name: ariaLabel })).toBeVisible();
    });

    it('renders every item except the last as a link with the correct label and href', () => {
      for (const item of items.slice(0, -1)) {
        expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
          'href',
          item.href,
        );
      }
    });

    it('names the home link by its label, with a decorative House icon', () => {
      const homeLink = screen.getByRole('link', { name: firstItem.label });
      const icon = homeLink.querySelector('svg');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('sets a title attribute on the first item for sighted hover users', () => {
      expect(
        screen.getByRole('link', { name: firstItem.label }),
      ).toHaveAttribute('title', firstItem.label);
    });

    it('renders the last item as text with aria-current="page", not a link', () => {
      const current = screen.getByText(lastItem.label);
      expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(
        screen.queryByRole('link', { name: lastItem.label }),
      ).not.toBeInTheDocument();
    });

    it('preserves trail order', () => {
      const rendered = screen
        .getAllByRole('listitem')
        .map((li) => li.textContent);
      expect(rendered).toEqual(items.map((item) => item.label));
    });

    it('sets a title attribute on the last item so its full text is available on hover', () => {
      expect(screen.getByText(lastItem.label)).toHaveAttribute(
        'title',
        lastItem.label,
      );
    });
  });

  it('sets a title attribute on the first item even when it is also the current page', () => {
    setup({ items: [firstItem] });
    expect(screen.getByTitle(firstItem.label)).toHaveAttribute(
      ARIA_CURRENT,
      'page',
    );
  });

  it('renders links via the linkAs component when provided', () => {
    setup({ linkAs: MockLink });
    const firstLink = screen.getByRole('link', { name: firstItem.label });
    expect(screen.getAllByTestId(MOCK_LINK_TEST_ID)).toContain(firstLink);
  });

  it('forwards dataTestId to the nav element', () => {
    setup({ dataTestId: 'breadcrumbs' });
    expect(screen.getByTestId('breadcrumbs')).toBeVisible();
  });
});
