import { usePathname } from '@admin/i18n/navigation';
import { renderWithIntl, screen } from '@admin/testing/custom-render';
import type { ComponentPropsWithoutRef } from 'react';

import { DashboardBreadcrumb } from './dashboard-breadcrumb';

vi.mock('@admin/i18n/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const render = renderWithIntl;

describe(DashboardBreadcrumb, () => {
  it('renders the single, non-clickable "Your site" item on the dashboard home route', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(<DashboardBreadcrumb />);

    expect(screen.getByText('Your site')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Your site' })).toBeNull();
  });

  it('links "Your site" back to /dashboard and shows Look as current on the look route', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/look');

    render(<DashboardBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Your site' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByText('Look')).toBeVisible();
  });

  it('shows Voice as current on the voice route', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/voice');

    render(<DashboardBreadcrumb />);

    expect(screen.getByText('Voice')).toBeVisible();
  });

  it('shows Features as current on the features route', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/features');

    render(<DashboardBreadcrumb />);

    expect(screen.getByText('Features')).toBeVisible();
  });
});
