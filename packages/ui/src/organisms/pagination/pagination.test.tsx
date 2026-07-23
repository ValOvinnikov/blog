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
  it('renders a labeled nav with a link per page and correct hrefs', () => {
    setup();

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
    setup();

    const nav = screen.getByRole('navigation', { name: 'Blog pages' });
    expect(within(nav).getByRole('list')).toBeVisible();
  });

  it('marks the current page with aria-current', () => {
    setup();

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute(
      'aria-current',
    );
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

  it('renders links via linkAs when provided', () => {
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

    // 3 page links + prev + next
    expect(screen.getAllByTestId('custom-link')).toHaveLength(5);
  });

  it('forwards data-testid', () => {
    setup({ currentPage: 1, totalPages: 2, dataTestId: 'blog-pagination' });
    expect(screen.getByTestId('blog-pagination')).toBeVisible();
  });
});
