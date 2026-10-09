import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { DashboardBreadcrumb } from './dashboard-breadcrumb';

vi.mock('@platform/i18n/navigation');

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

  it.each([
    ['/dashboard/languages', 'Languages'],
    ['/dashboard/domain', 'Domain'],
    ['/dashboard/email', 'Email'],
    ['/dashboard/studio', 'Studio'],
    ['/dashboard/studio/structure/post', 'Studio'],
  ])('ends %s with its own page name, %s', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValue(pathname);

    render(<DashboardBreadcrumb />);

    expect(screen.getByText(label)).toBeVisible();
    expect(screen.queryByText('Features')).not.toBeInTheDocument();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/unlisted');

    render(<DashboardBreadcrumb />);

    expect(screen.getByText('Your site')).toBeVisible();
    expect(screen.queryByText('Features')).not.toBeInTheDocument();
  });
});
