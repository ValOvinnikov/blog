import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

faker.seed(2407);

const TENANT_OVERVIEW_PATH = adminRoutes.tenantOverview(MOCK_TENANT_ID);
const MOCK_STUDIO_SUB_PATHNAME = `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/${faker.lorem.slug()}`;
const MOCK_UNLISTED_PATHNAME = `${TENANT_OVERVIEW_PATH}/${faker.lorem.slug()}`;

const {
  platformLabel,
  tenants,
  overview,
  look,
  voice,
  features,
  domain,
  email,
  studio,
  provisioning,
  dangerZone,
} = messages.navSections;

const setup = customRender(TenantBreadcrumb, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
});

describe(`<${TenantBreadcrumb.name}/>`, () => {
  it('renders Platform and a linked Tenants ancestor, plus a linked tenant name', () => {
    vi.mocked(usePathname).mockReturnValueOnce(
      adminRoutes.look(MOCK_TENANT_ID),
    );
    setup();

    const platformItem = screen.getByText(platformLabel);
    const platformLink = screen.queryByRole('link', { name: platformLabel });
    const tenantsLink = screen.getByRole('link', { name: tenants });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(platformItem).toBeVisible();
    expect(platformLink).not.toBeInTheDocument();
    expect(tenantsLink).toHaveAttribute('href', adminRoutes.tenants());
    expect(tenantLink).toHaveAttribute('href', TENANT_OVERVIEW_PATH);
  });

  it.each([
    {
      label: look,
      route: 'the look route',
      pathname: adminRoutes.look(MOCK_TENANT_ID),
    },
    {
      label: voice,
      route: 'the voice route',
      pathname: adminRoutes.voice(MOCK_TENANT_ID),
    },
    {
      label: features,
      route: 'the features route',
      pathname: adminRoutes.features(MOCK_TENANT_ID),
    },
    {
      label: domain,
      route: 'the domain route',
      pathname: adminRoutes.tenantDomain(MOCK_TENANT_ID),
    },
    {
      label: email,
      route: 'the email route',
      pathname: adminRoutes.email(MOCK_TENANT_ID),
    },
    {
      label: studio,
      route: 'the studio route',
      pathname: adminRoutes.tenantStudio(MOCK_TENANT_ID),
    },
    {
      label: studio,
      route: 'a Studio sub-route',
      pathname: MOCK_STUDIO_SUB_PATHNAME,
    },
    {
      label: provisioning,
      route: 'the provisioning route',
      pathname: adminRoutes.tenantProvisioning(MOCK_TENANT_ID),
    },
    {
      label: dangerZone,
      route: 'the danger route',
      pathname: adminRoutes.tenantDanger(MOCK_TENANT_ID),
    },
  ])(
    'shows $label as the unlinked current item on $route',
    ({ label, pathname }) => {
      vi.mocked(usePathname).mockReturnValueOnce(pathname);
      setup();

      const leafItem = screen.getByText(label);
      const leafLink = screen.queryByRole('link', { name: label });
      const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

      expect(leafItem).toBeVisible();
      expect(leafLink).not.toBeInTheDocument();
      expect(tenantLink).toHaveAttribute('href', TENANT_OVERVIEW_PATH);
    },
  );

  it.each([
    { route: 'the overview route', pathname: TENANT_OVERVIEW_PATH },
    { route: 'an unmatched route', pathname: MOCK_UNLISTED_PATHNAME },
  ])(
    'makes the tenant name the current item, with no leaf, on $route',
    ({ pathname }) => {
      vi.mocked(usePathname).mockReturnValueOnce(pathname);
      setup();

      const tenantItem = screen.getByText(MOCK_TENANT_NAME);
      const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });
      const overviewItem = screen.queryByText(overview);
      const studioItem = screen.queryByText(studio);

      expect(tenantItem).toBeVisible();
      expect(tenantLink).not.toBeInTheDocument();
      expect(overviewItem).not.toBeInTheDocument();
      expect(studioItem).not.toBeInTheDocument();
    },
  );
});
