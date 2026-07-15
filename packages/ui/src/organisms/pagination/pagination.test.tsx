import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const baseProps = {
  createHref,
  ariaLabel: 'Blog pages',
  previousLabel: 'Previous',
  nextLabel: 'Next',
};

describe(`<${Pagination.name}/>`, () => {
  it('renders a labeled nav with a link per page and correct hrefs', () => {
    render(<Pagination {...baseProps} currentPage={2} totalPages={3} />);

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
    render(<Pagination {...baseProps} currentPage={2} totalPages={3} />);

    const nav = screen.getByRole('navigation', { name: 'Blog pages' });
    expect(within(nav).getByRole('list')).toBeVisible();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination {...baseProps} currentPage={2} totalPages={3} />);

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('hides previous on the first page and next on the last page', () => {
    const { rerender } = render(
      <Pagination {...baseProps} currentPage={1} totalPages={3} />,
    );
    expect(
      screen.queryByRole('link', { name: 'Previous' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );

    rerender(<Pagination {...baseProps} currentPage={3} totalPages={3} />);
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );
    expect(
      screen.queryByRole('link', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <Pagination {...baseProps} currentPage={1} totalPages={1} />,
    );
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

    render(
      <Pagination
        {...baseProps}
        currentPage={2}
        totalPages={3}
        linkAs={CustomLink}
      />,
    );

    // 3 page links + prev + next
    expect(screen.getAllByTestId('custom-link')).toHaveLength(5);
  });

  it('forwards data-testid', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={1}
        totalPages={2}
        dataTestId="blog-pagination"
      />,
    );
    expect(screen.getByTestId('blog-pagination')).toBeVisible();
  });
});
