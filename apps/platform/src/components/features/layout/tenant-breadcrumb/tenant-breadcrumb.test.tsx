import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

const setup = (pathname: string) => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  renderWithIntl(
    <TenantBreadcrumb
      tenantId={MOCK_TENANT_ID}
      tenantName={MOCK_TENANT_NAME}
    />,
  );
};

const TENANT_PATH = `/tenants/${MOCK_TENANT_ID}`;

describe(TenantBreadcrumb, () => {
  it('renders Platform and a linked Tenants ancestor, plus a linked tenant name', () => {
    setup(`${TENANT_PATH}/look`);

    const platform = screen.getByText('Platform');
    const platformLink = screen.queryByRole('link', { name: 'Platform' });
    const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });
    expect(platform).toBeVisible();
    expect(platformLink).not.toBeInTheDocument();
    expect(tenantsLink).toHaveAttribute('href', '/tenants');
    expect(tenantLink).toHaveAttribute('href', TENANT_PATH);
  });

  it.each([
    [adminRoutes.look(MOCK_TENANT_ID), 'Look'],
    [adminRoutes.voice(MOCK_TENANT_ID), 'Voice'],
    [adminRoutes.features(MOCK_TENANT_ID), 'Features'],
    [adminRoutes.tenantDomain(MOCK_TENANT_ID), 'Domain'],
    [adminRoutes.email(MOCK_TENANT_ID), 'Email'],
    [adminRoutes.tenantStudio(MOCK_TENANT_ID), 'Studio'],
    [`${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/structure/post`, 'Studio'],
    [adminRoutes.tenantProvisioning(MOCK_TENANT_ID), 'Provisioning'],
    [adminRoutes.tenantDanger(MOCK_TENANT_ID), 'Danger zone'],
  ])('shows %s as the unlinked current item %s', (pathname, leaf) => {
    setup(pathname);

    const current = screen.getByText(leaf);
    const currentLink = screen.queryByRole('link', { name: leaf });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });
    expect(current).toBeVisible();
    expect(currentLink).not.toBeInTheDocument();
    expect(tenantLink).toHaveAttribute('href', TENANT_PATH);
  });

  it('shows the tenant name as the unlinked current item on the overview route', () => {
    setup(TENANT_PATH);

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });
    const overview = screen.queryByText('Overview');
    expect(tenantName).toBeVisible();
    expect(tenantLink).not.toBeInTheDocument();
    expect(overview).not.toBeInTheDocument();
  });

  it('omits the leaf on an unmatched route, making the tenant name the current item', () => {
    setup(`${TENANT_PATH}/unlisted`);

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });
    const features = screen.queryByText('Features');
    expect(tenantName).toBeVisible();
    expect(tenantLink).not.toBeInTheDocument();
    expect(features).not.toBeInTheDocument();
  });
});
