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

    const dashboardItem = screen.getByText(DASHBOARD_LABEL);
    const dashboardLink = screen.queryByRole('link', { name: DASHBOARD_LABEL });
    const overviewItem = screen.queryByText('Overview');

    expect(dashboardItem).toBeVisible();
    expect(dashboardLink).not.toBeInTheDocument();
    expect(overviewItem).not.toBeInTheDocument();
  });

  it('links Dashboard back home and shows Look as current on the look route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.dashboardLook());

    render(<DashboardBreadcrumb />);

    const dashboardLink = screen.getByRole('link', { name: DASHBOARD_LABEL });
    const lookItem = screen.getByText('Look');

    expect(dashboardLink).toHaveAttribute('href', adminRoutes.dashboard());
    expect(lookItem).toBeVisible();
  });

  it('shows Features as current on the features route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.dashboardFeatures());

    render(<DashboardBreadcrumb />);

    const featuresItem = screen.getByText(FEATURES_LABEL);

    expect(featuresItem).toBeVisible();
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

    const leafItem = screen.getByText(label);
    const featuresItem = screen.queryByText(FEATURES_LABEL);

    expect(leafItem).toBeVisible();
    expect(featuresItem).not.toBeInTheDocument();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/unlisted');

    render(<DashboardBreadcrumb />);

    const dashboardItem = screen.getByText(DASHBOARD_LABEL);
    const featuresItem = screen.queryByText(FEATURES_LABEL);

    expect(dashboardItem).toBeVisible();
    expect(featuresItem).not.toBeInTheDocument();
  });
});
