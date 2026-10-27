import { BREADCRUMBS_HOME_ICON_TEST_ID } from '@blog/ui/constants/breadcrumbs';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { Breadcrumbs } from './breadcrumbs';

faker.seed(123);

const MOCK_FIRST_ITEM = {
  label: faker.lorem.word(),
  href: `/${faker.lorem.slug()}`,
};
const MOCK_MIDDLE_ITEM = {
  label: faker.commerce.department(),
  href: `/topics/${faker.lorem.slug()}`,
};
const MOCK_LAST_ITEM = {
  label: faker.lorem.sentence(4),
  href: `/blog/${faker.lorem.slug()}`,
};
const MOCK_ITEMS = [MOCK_FIRST_ITEM, MOCK_MIDDLE_ITEM, MOCK_LAST_ITEM];
const MOCK_ARIA_LABEL = faker.lorem.words(2);

const setup = customRender(Breadcrumbs, {
  items: MOCK_ITEMS,
  ariaLabel: MOCK_ARIA_LABEL,
});

describe(`<${Breadcrumbs.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the navigation landmark', () => {
      const nav = screen.getByRole('navigation', { name: MOCK_ARIA_LABEL });

      expect(nav).toBeVisible();
    });

    it('renders every item except the last as a link to its href', () => {
      for (const item of MOCK_ITEMS.slice(0, -1)) {
        const itemLink = screen.getByRole('link', { name: item.label });

        expect(itemLink).toHaveAttribute('href', item.href);
      }
    });

    it('names the home link by its label, with a decorative icon', () => {
      const homeLink = screen.getByRole('link', {
        name: MOCK_FIRST_ITEM.label,
      });
      const icon = within(homeLink).getByTestId(BREADCRUMBS_HOME_ICON_TEST_ID);

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it.each([MOCK_FIRST_ITEM, MOCK_LAST_ITEM])(
      'gives "$label" a title carrying its full text',
      ({ label }) => {
        const titled = screen.getByTitle(label);

        expect(titled).toHaveTextContent(label);
      },
    );

    it('renders the last item as the current page, not a link', () => {
      const current = screen.getByText(MOCK_LAST_ITEM.label);
      const currentLink = screen.queryByRole('link', {
        name: MOCK_LAST_ITEM.label,
      });

      expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(currentLink).not.toBeInTheDocument();
    });

    it('preserves trail order', () => {
      const listItems = screen.getAllByRole('listitem');
      const rendered = listItems.map((listItem) => listItem.textContent);

      expect(rendered).toEqual(MOCK_ITEMS.map((item) => item.label));
    });
  });

  it('titles the first item even when it is also the current page', () => {
    setup({ items: [MOCK_FIRST_ITEM] });

    const current = screen.getByTitle(MOCK_FIRST_ITEM.label);

    expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders links through a supplied link component', () => {
    setup({ linkAs: MockLink });

    const firstLink = screen.getByRole('link', {
      name: MOCK_FIRST_ITEM.label,
    });
    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);

    expect(mockLinks).toContain(firstLink);
  });
});
