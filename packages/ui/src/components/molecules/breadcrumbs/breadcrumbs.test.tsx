import { BREADCRUMBS_HOME_ICON_TEST_ID } from '@blog/ui/constants/breadcrumbs';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
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
      const nav = screen.getByRole('navigation', { name: ariaLabel });

      expect(nav).toBeVisible();
    });

    it('renders every item except the last as a link with the correct label and href', () => {
      for (const item of items.slice(0, -1)) {
        const itemLink = screen.getByRole('link', { name: item.label });

        expect(itemLink).toHaveAttribute('href', item.href);
      }
    });

    it('names the home link by its label, with a decorative House icon', () => {
      const homeLink = screen.getByRole('link', { name: firstItem.label });
      const icon = within(homeLink).getByTestId(BREADCRUMBS_HOME_ICON_TEST_ID);

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it.each([
      ['first', firstItem],
      ['last', lastItem],
    ])(
      'sets a title attribute on the %s item so its full text is available on hover',
      (_position, { label }) => {
        const titled = screen.getByTitle(label);

        expect(titled).toHaveTextContent(label);
      },
    );

    it('renders the last item as text with aria-current="page", not a link', () => {
      const current = screen.getByText(lastItem.label);
      const currentLink = screen.queryByRole('link', { name: lastItem.label });

      expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(currentLink).not.toBeInTheDocument();
    });

    it('preserves trail order', () => {
      const listItems = screen.getAllByRole('listitem');
      const rendered = listItems.map((li) => li.textContent);

      expect(rendered).toEqual(items.map((item) => item.label));
    });
  });

  it('sets a title attribute on the first item even when it is also the current page', () => {
    setup({ items: [firstItem] });
    const current = screen.getByTitle(firstItem.label);

    expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders links via the linkAs component when provided', () => {
    setup({ linkAs: MockLink });
    const firstLink = screen.getByRole('link', { name: firstItem.label });
    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);

    expect(mockLinks).toContain(firstLink);
  });
});
