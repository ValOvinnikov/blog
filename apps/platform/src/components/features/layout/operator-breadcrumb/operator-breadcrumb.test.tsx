import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { OperatorBreadcrumb } from './operator-breadcrumb';

vi.mock('@platform/i18n/navigation');

const render = renderWithIntl;

describe(OperatorBreadcrumb, () => {
  it('renders a 2-segment trail on the tenants list, with Tenants current', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants');

    render(<OperatorBreadcrumb />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Platform' })).toBeNull();
    expect(screen.getByText('Tenants')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Tenants' })).toBeNull();
  });

  it('renders a 3-segment trail with a linked Tenants on the add-tenant route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/new');

    render(<OperatorBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(screen.getByText('Add tenant')).toBeVisible();
  });

  it('renders a 2-segment trail on the findings list, with Findings current', () => {
    vi.mocked(usePathname).mockReturnValue('/findings');

    render(<OperatorBreadcrumb />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('Findings')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Findings' })).toBeNull();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValue('/unlisted');

    render(<OperatorBreadcrumb />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
  });
});
