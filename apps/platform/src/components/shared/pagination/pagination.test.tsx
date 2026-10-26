import { customRender, screen } from '@platform/testing/custom-render';
import { findServerEventHandlers } from '@platform/testing/server-event-handlers';

import { Pagination } from './pagination';

vi.mock('@platform/i18n/navigation');

const PREVIOUS = 'Previous';
const NEXT = 'Next';

const pageHref = (page: number) => `/items?page=${page}`;

const setup = customRender(Pagination, {
  page: 2,
  totalPages: 3,
  pageHref,
});

describe(`<${Pagination.name}/>`, () => {
  it('renders nothing when everything fits on one page', () => {
    setup({ page: 1, totalPages: 1 });

    const navigation = screen.queryByRole('navigation');

    expect(navigation).not.toBeInTheDocument();
  });

  it('links to the neighbouring pages and states the current position', () => {
    setup();

    const previousLink = screen.getByRole('link', { name: PREVIOUS });
    const nextLink = screen.getByRole('link', { name: NEXT });
    const position = screen.getByText('Page 2 of 3');

    expect(previousLink).toHaveAttribute('href', '/items?page=1');
    expect(nextLink).toHaveAttribute('href', '/items?page=3');
    expect(position).toBeVisible();
  });

  it('disables Previous on the first page', () => {
    setup({ page: 1 });

    const previousButton = screen.getByRole('button', { name: PREVIOUS });

    expect(previousButton).toBeDisabled();
  });

  it('disables Next on the last page', () => {
    setup({ page: 3 });

    const nextButton = screen.getByRole('button', { name: NEXT });

    expect(nextButton).toBeDisabled();
  });

  it('renders from a Server Component on the first and the last page', () => {
    const firstPage = (
      <Pagination page={1} totalPages={2} pageHref={pageHref} />
    );
    const lastPage = <Pagination page={2} totalPages={2} pageHref={pageHref} />;

    expect(findServerEventHandlers(firstPage)).toEqual([]);
    expect(findServerEventHandlers(lastPage)).toEqual([]);
  });
});
