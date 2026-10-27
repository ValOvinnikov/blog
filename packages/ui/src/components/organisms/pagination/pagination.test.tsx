import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { Pagination } from './pagination';

faker.seed(123);

const ELLIPSIS = '…';
const PAGE_LINK_NAME = /^\d+$/;
const MOCK_BASE_PATH = `/${faker.lorem.slug()}`;
const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_PREVIOUS_LABEL = faker.lorem.word();
const MOCK_NEXT_LABEL = faker.lorem.word();

const createHref = (page: number) =>
  page === 1 ? MOCK_BASE_PATH : `${MOCK_BASE_PATH}/page/${page}`;

const setup = customRender(Pagination, {
  createHref,
  ariaLabel: MOCK_ARIA_LABEL,
  previousLabel: MOCK_PREVIOUS_LABEL,
  nextLabel: MOCK_NEXT_LABEL,
  currentPage: 2,
  totalPages: 3,
});

const pageLinkNumbers = () =>
  screen
    .getAllByRole('link', { name: PAGE_LINK_NAME })
    .map((link) => Number(link.textContent));

describe(`<${Pagination.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it.each([1, 2, 3])('links page %i to its href', (page) => {
      const pageLink = screen.getByRole('link', { name: String(page) });

      expect(pageLink).toHaveAttribute('href', createHref(page));
    });

    it('exposes the page list inside a labelled nav', () => {
      const paginationNav = screen.getByRole('navigation', {
        name: MOCK_ARIA_LABEL,
      });
      const pageList = within(paginationNav).getByRole('list');

      expect(pageList).toBeVisible();
    });

    it('marks the current page with aria-current', () => {
      const currentLink = screen.getByRole('link', { name: '2' });
      const otherLink = screen.getByRole('link', { name: '1' });

      expect(currentLink).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(otherLink).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  it('hides previous on the first page', () => {
    setup({ currentPage: 1 });

    const previousLink = screen.queryByRole('link', {
      name: MOCK_PREVIOUS_LABEL,
    });
    const nextLink = screen.getByRole('link', { name: MOCK_NEXT_LABEL });

    expect(previousLink).not.toBeInTheDocument();
    expect(nextLink).toHaveAttribute('href', createHref(2));
  });

  it('hides next on the last page', () => {
    setup({ currentPage: 3 });

    const previousLink = screen.getByRole('link', {
      name: MOCK_PREVIOUS_LABEL,
    });
    const nextLink = screen.queryByRole('link', { name: MOCK_NEXT_LABEL });

    expect(previousLink).toHaveAttribute('href', createHref(2));
    expect(nextLink).not.toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = setup({ currentPage: 1, totalPages: 1 });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders every page, previous and next link through linkAs', () => {
    setup({ linkAs: MockLink });

    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);

    expect(mockLinks).toHaveLength(5);
  });

  describe('truncation', () => {
    it.each([
      {
        name: 'every page when the total fits the visible range',
        currentPage: 4,
        totalPages: 7,
        pages: [1, 2, 3, 4, 5, 6, 7],
        ellipses: 0,
      },
      {
        name: 'a leading run and the last page near the first page',
        currentPage: 1,
        totalPages: 12,
        pages: [1, 2, 3, 4, 5, 12],
        ellipses: 1,
      },
      {
        name: 'the first page and a trailing run near the last page',
        currentPage: 12,
        totalPages: 12,
        pages: [1, 8, 9, 10, 11, 12],
        ellipses: 1,
      },
      {
        name: 'the ends and neighbours in the middle of a long run',
        currentPage: 6,
        totalPages: 12,
        pages: [1, 5, 6, 7, 12],
        ellipses: 2,
      },
    ])('shows $name', ({ currentPage, totalPages, pages, ellipses }) => {
      setup({ currentPage, totalPages });

      const ellipsisMarks = screen.queryAllByText(ELLIPSIS);

      expect(pageLinkNumbers()).toEqual(pages);
      expect(ellipsisMarks).toHaveLength(ellipses);
    });

    it('leaves the ellipsis out of the list items', () => {
      setup({ currentPage: 6, totalPages: 12 });

      const listItems = screen.getAllByRole('listitem');

      expect(listItems).toHaveLength(5);
    });
  });
});
