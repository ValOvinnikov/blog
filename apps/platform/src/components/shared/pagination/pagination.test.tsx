import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { Pagination } from './pagination';

const setup = customRender(Pagination, {
  page: 2,
  totalPages: 3,
  pageHref: adminRoutes.dashboardLeads,
});

describe(`<${Pagination.name}/>`, () => {
  it('renders nothing when everything fits on one page', () => {
    setup({ page: 1, totalPages: 1 });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('links to the previous and next pages and says where the owner is', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/dashboard/leads',
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/dashboard/leads?page=3',
    );
    expect(screen.getByText('Page 2 of 3')).toBeVisible();
  });

  it('links with whatever page address the caller builds', () => {
    setup({ pageHref: (page) => `/tenants/t-1/leads?page=${page}` });

    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/tenants/t-1/leads?page=3',
    );
  });

  it('disables Previous on the first page', () => {
    setup({ page: 1 });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/dashboard/leads?page=2',
    );
  });

  it('disables Next on the last page', () => {
    setup({ page: 3 });

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
