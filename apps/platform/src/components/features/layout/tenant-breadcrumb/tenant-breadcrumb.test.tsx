import { usePathname } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

const setup = customRender(TenantBreadcrumb, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
});

const STUDIO = 'Studio';
const TENANT_OVERVIEW_PATH = adminRoutes.tenantOverview(MOCK_TENANT_ID);

describe(`<${TenantBreadcrumb.name}/>`, () => {
  it('renders Platform and a linked Tenants ancestor, plus a linked tenant name', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.look(MOCK_TENANT_ID));

    setup();

    const platformText = screen.getByText('Platform');
    const platformLink = screen.queryByRole('link', { name: 'Platform' });
    const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(platformText).toBeVisible();
    expect(platformLink).not.toBeInTheDocument();
    expect(tenantsLink).toHaveAttribute('href', adminRoutes.tenants());
    expect(tenantLink).toHaveAttribute('href', TENANT_OVERVIEW_PATH);
  });

  it.each([
    {
      label: 'Look',
      route: 'the look route',
      pathname: adminRoutes.look(MOCK_TENANT_ID),
    },
    {
      label: 'Voice',
      route: 'the voice route',
      pathname: adminRoutes.voice(MOCK_TENANT_ID),
    },
    {
      label: 'Features',
      route: 'the features route',
      pathname: adminRoutes.features(MOCK_TENANT_ID),
    },
    {
      label: 'Domain',
      route: 'the domain route',
      pathname: adminRoutes.tenantDomain(MOCK_TENANT_ID),
    },
    {
      label: 'Email',
      route: 'the email route',
      pathname: adminRoutes.email(MOCK_TENANT_ID),
    },
    {
      label: STUDIO,
      route: 'the studio route',
      pathname: adminRoutes.tenantStudio(MOCK_TENANT_ID),
    },
    {
      label: STUDIO,
      route: 'a Studio sub-route',
      pathname: `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/structure/post`,
    },
    {
      label: 'Provisioning',
      route: 'the provisioning route',
      pathname: adminRoutes.tenantProvisioning(MOCK_TENANT_ID),
    },
    {
      label: 'Danger zone',
      route: 'the danger route',
      pathname: adminRoutes.tenantDanger(MOCK_TENANT_ID),
    },
  ])(
    'shows $label as the unlinked current item on $route',
    ({ label, pathname }) => {
      vi.mocked(usePathname).mockReturnValue(pathname);

      setup();

      const leafText = screen.getByText(label);
      const leafLink = screen.queryByRole('link', { name: label });
      const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

      expect(leafText).toBeVisible();
      expect(leafLink).not.toBeInTheDocument();
      expect(tenantLink).toHaveAttribute('href', TENANT_OVERVIEW_PATH);
    },
  );

  it.each([
    { route: 'the overview route', pathname: TENANT_OVERVIEW_PATH },
    {
      route: 'an unmatched route',
      pathname: `${TENANT_OVERVIEW_PATH}/unlisted`,
    },
  ])(
    'makes the tenant name the current item, with no leaf, on $route',
    ({ pathname }) => {
      vi.mocked(usePathname).mockReturnValue(pathname);

      setup();

      const tenantName = screen.getByText(MOCK_TENANT_NAME);
      const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });
      const overviewText = screen.queryByText('Overview');
      const studioText = screen.queryByText(STUDIO);

      expect(tenantName).toBeVisible();
      expect(tenantLink).not.toBeInTheDocument();
      expect(overviewText).not.toBeInTheDocument();
      expect(studioText).not.toBeInTheDocument();
    },
  );
});
