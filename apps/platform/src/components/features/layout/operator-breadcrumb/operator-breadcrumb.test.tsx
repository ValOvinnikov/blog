import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { OperatorBreadcrumb } from './operator-breadcrumb';

vi.mock('@platform/i18n/navigation');

faker.seed(2405);

const MOCK_UNLISTED_PATHNAME = `/${faker.lorem.slug()}`;

const { platformLabel, tenants, addTenant, findings, releases } =
  messages.navSections;

const setup = customRender(OperatorBreadcrumb, { role: ADMIN_ROLE.ADMIN });

describe(`<${OperatorBreadcrumb.name}/>`, () => {
  it.each([
    { pathname: adminRoutes.tenants(), leaf: tenants },
    { pathname: adminRoutes.findings(), leaf: findings },
  ])(
    'ends the Platform trail with $leaf, unlinked, on $pathname',
    ({ pathname, leaf }) => {
      vi.mocked(usePathname).mockReturnValueOnce(pathname);
      setup();

      const platformItem = screen.getByText(platformLabel);
      const platformLink = screen.queryByRole('link', { name: platformLabel });
      const leafItem = screen.getByText(leaf);
      const leafLink = screen.queryByRole('link', { name: leaf });

      expect(platformItem).toBeVisible();
      expect(platformLink).not.toBeInTheDocument();
      expect(leafItem).toBeVisible();
      expect(leafLink).not.toBeInTheDocument();
    },
  );

  it('links back to Tenants from the add-tenant route', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.newTenant());
    setup();

    const tenantsLink = screen.getByRole('link', { name: tenants });
    const addTenantItem = screen.getByText(addTenant);

    expect(tenantsLink).toHaveAttribute('href', adminRoutes.tenants());
    expect(addTenantItem).toBeVisible();
  });

  it('shows no leaf on a route the nav does not list', () => {
    vi.mocked(usePathname).mockReturnValueOnce(MOCK_UNLISTED_PATHNAME);
    setup();

    const platformItem = screen.getByText(platformLabel);
    const tenantsItem = screen.queryByText(tenants);

    expect(platformItem).toBeVisible();
    expect(tenantsItem).not.toBeInTheDocument();
  });

  it('names Releases as the leaf for a superadmin on the releases route', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.releases());
    setup({ role: ADMIN_ROLE.SUPERADMIN });

    const releasesItem = screen.getByText(releases);

    expect(releasesItem).toBeVisible();
  });

  it('shows no leaf on the releases route for an admin', () => {
    vi.mocked(usePathname).mockReturnValueOnce(adminRoutes.releases());
    setup();

    const releasesItem = screen.queryByText(releases);

    expect(releasesItem).not.toBeInTheDocument();
  });
});
