import { render, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { Breadcrumbs } from './breadcrumbs';

vi.mock('@platform/i18n/navigation');

const TENANTS = 'Tenants';
const PLATFORM = 'Platform';
const LOOK = 'Look';
const ARIA_CURRENT = 'aria-current';

describe(Breadcrumbs, () => {
  it('renders every ancestor with an href as a real link', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[
          { label: PLATFORM },
          { label: TENANTS, href: adminRoutes.tenants() },
          { label: MOCK_TENANT_NAME },
        ]}
      />,
    );

    const tenantsLink = screen.getByRole('link', { name: TENANTS });

    expect(tenantsLink).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('renders the last item as the current, non-clickable label even with an href', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[
          { label: 'Your site', href: adminRoutes.dashboard() },
          { label: LOOK, href: adminRoutes.dashboardLook() },
        ]}
      />,
    );

    const yourSiteLink = screen.getByRole('link', { name: 'Your site' });
    const lookLink = screen.queryByRole('link', { name: LOOK });
    const current = screen.getByText(LOOK);

    expect(yourSiteLink).toHaveAttribute('href', adminRoutes.dashboard());
    expect(lookLink).not.toBeInTheDocument();
    expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders an ancestor with no href as a non-clickable label, not a link', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[{ label: PLATFORM }, { label: TENANTS }]}
      />,
    );

    const platformLink = screen.queryByRole('link', { name: PLATFORM });
    const platformText = screen.getByText(PLATFORM);

    expect(platformLink).not.toBeInTheDocument();
    expect(platformText).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders a nav landmark labelled with the given ariaLabel', () => {
    render(
      <Breadcrumbs ariaLabel="Breadcrumb" items={[{ label: PLATFORM }]} />,
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(nav).toBeVisible();
  });
});
