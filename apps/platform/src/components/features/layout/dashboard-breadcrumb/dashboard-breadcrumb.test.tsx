import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { DashboardBreadcrumb } from './dashboard-breadcrumb';

vi.mock('@platform/i18n/navigation');

faker.seed(2406);

const MOCK_UNLISTED_PATHNAME = `${adminRoutes.dashboard()}/${faker.lorem.slug()}`;
const MOCK_STUDIO_SUB_PATHNAME = `${adminRoutes.dashboardStudio()}/${faker.lorem.slug()}`;

const {
  dashboardLabel,
  overview,
  look,
  features,
  voice,
  languages,
  domain,
  email,
  studio,
} = messages.navSections;

const setup = customRender(DashboardBreadcrumb, {});

describe(`<${DashboardBreadcrumb.name}/>`, () => {
  it('shows only an unlinked Dashboard on the dashboard home route', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.dashboard());
    setup();

    const dashboardItem = screen.getByText(dashboardLabel);
    const dashboardLink = screen.queryByRole('link', { name: dashboardLabel });
    const overviewItem = screen.queryByText(overview);

    expect(dashboardItem).toBeVisible();
    expect(dashboardLink).not.toBeInTheDocument();
    expect(overviewItem).not.toBeInTheDocument();
  });

  it('links Dashboard back home and shows Look as current on the look route', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.dashboardLook());
    setup();

    const dashboardLink = screen.getByRole('link', { name: dashboardLabel });
    const lookItem = screen.getByText(look);

    expect(dashboardLink).toHaveAttribute('href', adminRoutes.dashboard());
    expect(lookItem).toBeVisible();
  });

  it('shows Features as current on the features route', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.dashboardFeatures());
    setup();

    const featuresItem = screen.getByText(features);

    expect(featuresItem).toBeVisible();
  });

  it.each([
    [adminRoutes.dashboardVoice(), voice],
    [adminRoutes.dashboardLanguages(), languages],
    [adminRoutes.dashboardDomain(), domain],
    [adminRoutes.dashboardEmail(), email],
    [adminRoutes.dashboardStudio(), studio],
    [MOCK_STUDIO_SUB_PATHNAME, studio],
  ])('ends %s with its own page name, %s', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValueOnce(pathname);
    setup();

    const leafItem = screen.getByText(label);
    const featuresItem = screen.queryByText(features);

    expect(leafItem).toBeVisible();
    expect(featuresItem).not.toBeInTheDocument();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValueOnce(MOCK_UNLISTED_PATHNAME);
    setup();

    const dashboardItem = screen.getByText(dashboardLabel);
    const featuresItem = screen.queryByText(features);

    expect(dashboardItem).toBeVisible();
    expect(featuresItem).not.toBeInTheDocument();
  });
});
