import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { DashboardBreadcrumb } from './dashboard-breadcrumb';

vi.mock('@platform/i18n/navigation');

const render = renderWithIntl;

const DASHBOARD_LABEL = 'Dashboard';
const FEATURES_LABEL = 'Features';

describe(`<${DashboardBreadcrumb.name}/>`, () => {
  it('renders the single, non-clickable Dashboard item on the dashboard home route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.dashboard());

    render(<DashboardBreadcrumb />);

    expect(screen.getByText(DASHBOARD_LABEL)).toBeVisible();
    expect(screen.queryByRole('link', { name: DASHBOARD_LABEL })).toBeNull();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('links Dashboard back home and shows Look as current on the look route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.dashboardLook());

    render(<DashboardBreadcrumb />);

    expect(screen.getByRole('link', { name: DASHBOARD_LABEL })).toHaveAttribute(
      'href',
      adminRoutes.dashboard(),
    );
    expect(screen.getByText('Look')).toBeVisible();
  });

  it('shows Features as current on the features route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.dashboardFeatures());

    render(<DashboardBreadcrumb />);

    expect(screen.getByText(FEATURES_LABEL)).toBeVisible();
  });

  it.each([
    ['/dashboard/voice', 'Voice'],
    ['/dashboard/languages', 'Languages'],
    ['/dashboard/domain', 'Domain'],
    ['/dashboard/email', 'Email'],
    ['/dashboard/studio', 'Studio'],
    ['/dashboard/studio/structure/post', 'Studio'],
  ])('ends %s with its own page name, %s', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValue(pathname);

    render(<DashboardBreadcrumb />);

    expect(screen.getByText(label)).toBeVisible();
    expect(screen.queryByText(FEATURES_LABEL)).not.toBeInTheDocument();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/unlisted');

    render(<DashboardBreadcrumb />);

    expect(screen.getByText(DASHBOARD_LABEL)).toBeVisible();
    expect(screen.queryByText(FEATURES_LABEL)).not.toBeInTheDocument();
  });
});
