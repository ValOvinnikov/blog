import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const ARIA_LABEL = 'Blog pages';
const PAGINATION_TEST_ID = 'blog-pagination';
const PREVIOUS_LABEL = 'Previous';
const NEXT_LABEL = 'Next';

const setup = customRender(Pagination, {
  createHref,
  ariaLabel: ARIA_LABEL,
  previousLabel: PREVIOUS_LABEL,
  nextLabel: NEXT_LABEL,
  currentPage: 2,
  totalPages: 3,
});

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
        name: ARIA_LABEL,
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
    const previousLink = screen.queryByRole('link', { name: PREVIOUS_LABEL });
    const nextLink = screen.getByRole('link', { name: NEXT_LABEL });
    expect(previousLink).not.toBeInTheDocument();
    expect(nextLink).toHaveAttribute('href', createHref(2));
  });

  it('hides next on the last page', () => {
    setup({ currentPage: 3 });
    const previousLink = screen.getByRole('link', { name: PREVIOUS_LABEL });
    const nextLink = screen.queryByRole('link', { name: NEXT_LABEL });
    expect(previousLink).toHaveAttribute('href', createHref(2));
    expect(nextLink).not.toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = setup({ currentPage: 1, totalPages: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders links via linkAs when provided, one per page link plus prev and next', () => {
    setup({ linkAs: MockLink });

    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);
    expect(mockLinks).toHaveLength(5);
  });

  it('forwards data-testid', () => {
    setup({ currentPage: 1, totalPages: 2, dataTestId: PAGINATION_TEST_ID });
    const pagination = screen.getByTestId(PAGINATION_TEST_ID);
    expect(pagination).toBeVisible();
  });

  describe('truncation', () => {
    const pageLinkNumbers = () => {
      const links = screen.getAllByRole('link');
      return links
        .map((link) => link.textContent)
        .filter((text) => text !== null && /^\d+$/.test(text))
        .map(Number);
    };

    it('renders every page when the total fits within the visible range', () => {
      setup({ currentPage: 4, totalPages: 7 });
      const ellipsis = screen.queryByText('…');
      expect(pageLinkNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(ellipsis).not.toBeInTheDocument();
    });

    it('shows a leading run plus the last page, with one ellipsis, near the first page', () => {
      setup({ currentPage: 1, totalPages: 12 });
      const ellipses = screen.getAllByText('…');
      expect(pageLinkNumbers()).toEqual([1, 2, 3, 4, 5, 12]);
      expect(ellipses).toHaveLength(1);
    });

    it('shows the first page plus a trailing run, with one ellipsis, near the last page', () => {
      setup({ currentPage: 12, totalPages: 12 });
      const ellipses = screen.getAllByText('…');
      expect(pageLinkNumbers()).toEqual([1, 8, 9, 10, 11, 12]);
      expect(ellipses).toHaveLength(1);
    });

    describe('in the middle of a long run', () => {
      beforeEach(() => {
        setup({ currentPage: 6, totalPages: 12 });
      });

      it('shows the first, last and neighbouring pages, with two ellipses', () => {
        const ellipses = screen.getAllByText('…');
        expect(pageLinkNumbers()).toEqual([1, 5, 6, 7, 12]);
        expect(ellipses).toHaveLength(2);
      });

      it('hides the ellipsis from the accessibility tree', () => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(5);
      });
    });
  });
});
