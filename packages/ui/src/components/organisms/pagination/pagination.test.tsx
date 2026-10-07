import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import type { ReactNode } from 'react';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const setup = customRender(Pagination, {
  createHref,
  ariaLabel: 'Blog pages',
  previousLabel: 'Previous',
  nextLabel: 'Next',
  currentPage: 2,
  totalPages: 3,
});

describe(`<${Pagination.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labeled nav with a link per page and correct hrefs', () => {
      expect(
        screen.getByRole('navigation', { name: 'Blog pages' }),
      ).toBeVisible();
      expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
        'href',
        '/blog',
      );
      expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
        'href',
        '/blog/page/2',
      );
      expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
        'href',
        '/blog/page/3',
      );
    });

    it('exposes the page list with an explicit list role', () => {
      const nav = screen.getByRole('navigation', { name: 'Blog pages' });
      expect(within(nav).getByRole('list')).toBeVisible();
    });

    it('marks the current page with aria-current', () => {
      expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute(
        'aria-current',
      );
    });
  });

  it('hides previous on the first page and next on the last page', () => {
    const { rerender } = setup({ currentPage: 1 });
    expect(
      screen.queryByRole('link', { name: 'Previous' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );

    rerender(
      <Pagination
        createHref={createHref}
        ariaLabel="Blog pages"
        previousLabel="Previous"
        nextLabel="Next"
        currentPage={3}
        totalPages={3}
      />,
    );
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );
    expect(
      screen.queryByRole('link', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = setup({ currentPage: 1, totalPages: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders links via linkAs when provided, one per page link plus prev and next', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    setup({ linkAs: CustomLink });

    expect(screen.getAllByTestId('custom-link')).toHaveLength(5);
  });

  it('forwards data-testid', () => {
    setup({ currentPage: 1, totalPages: 2, dataTestId: 'blog-pagination' });
    expect(screen.getByTestId('blog-pagination')).toBeVisible();
  });

  describe('truncation', () => {
    const pageLinkNumbers = () =>
      screen
        .getAllByRole('link')
        .map((link) => link.textContent)
        .filter((text) => text !== null && /^\d+$/.test(text))
        .map(Number);

    it('renders every page when the total fits within the visible range', () => {
      setup({ currentPage: 4, totalPages: 7 });
      expect(pageLinkNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(screen.queryByText('…')).not.toBeInTheDocument();
    });

    it('shows a leading run plus the last page, with one ellipsis, near the first page', () => {
      setup({ currentPage: 1, totalPages: 12 });
      expect(pageLinkNumbers()).toEqual([1, 2, 3, 4, 5, 12]);
      expect(screen.getAllByText('…')).toHaveLength(1);
    });

    it('shows the first page plus a trailing run, with one ellipsis, near the last page', () => {
      setup({ currentPage: 12, totalPages: 12 });
      expect(pageLinkNumbers()).toEqual([1, 8, 9, 10, 11, 12]);
      expect(screen.getAllByText('…')).toHaveLength(1);
    });

    describe('in the middle of a long run', () => {
      beforeEach(() => {
        setup({ currentPage: 6, totalPages: 12 });
      });

      it('shows the first page, the last page, and the current page neighbours, with two ellipses, in the middle', () => {
        expect(pageLinkNumbers()).toEqual([1, 5, 6, 7, 12]);
        expect(screen.getAllByText('…')).toHaveLength(2);
      });

      it('hides the ellipsis from the accessibility tree', () => {
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
      });
    });
  });
});
