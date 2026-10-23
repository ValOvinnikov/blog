import { usePathname } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

const setup = customRender(TenantBreadcrumb, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
});

const DANGER_ZONE = 'Danger zone';
const LOOK = 'Look';
const FEATURES = 'Features';
const STUDIO = 'Studio';
const PROVISIONING = 'Provisioning';

describe(TenantBreadcrumb, () => {
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
    expect(tenantLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );
  });

  it('shows the tenant name as the unlinked current item on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );

    setup();

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });

    expect(tenantName).toBeVisible();
    expect(tenantLink).not.toBeInTheDocument();
  });

  it('shows Look as the current item on the look route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.look(MOCK_TENANT_ID));

    setup();

    const lookText = screen.getByText(LOOK);
    const lookLink = screen.queryByRole('link', { name: LOOK });

    expect(lookText).toBeVisible();
    expect(lookLink).not.toBeInTheDocument();
  });

  it('shows Voice as the current item on the voice route', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.voice(MOCK_TENANT_ID));

    setup();

    const voiceText = screen.getByText('Voice');

    expect(voiceText).toBeVisible();
  });

  it('shows Features as the current item on the features route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.features(MOCK_TENANT_ID),
    );

    setup();

    const featuresText = screen.getByText(FEATURES);

    expect(featuresText).toBeVisible();
  });

  it('shows Domain as the current item on the domain route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantDomain(MOCK_TENANT_ID),
    );

    setup();

    const domainText = screen.getByText('Domain');

    expect(domainText).toBeVisible();
  });

  it('shows Studio as the current item on the studio route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantStudio(MOCK_TENANT_ID),
    );

    setup();

    const studioText = screen.getByText(STUDIO);
    const studioLink = screen.queryByRole('link', { name: STUDIO });

    expect(studioText).toBeVisible();
    expect(studioLink).not.toBeInTheDocument();
  });

  it('shows Provisioning as the current item on the provisioning route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantProvisioning(MOCK_TENANT_ID),
    );

    setup();

    const provisioningText = screen.getByText(PROVISIONING);
    const provisioningLink = screen.queryByRole('link', {
      name: PROVISIONING,
    });

    expect(provisioningText).toBeVisible();
    expect(provisioningLink).not.toBeInTheDocument();
  });

  it('shows Danger zone as the current item on the danger route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantDanger(MOCK_TENANT_ID),
    );

    setup();

    const dangerText = screen.getByText(DANGER_ZONE);
    const dangerLink = screen.queryByRole('link', { name: DANGER_ZONE });

    expect(dangerText).toBeVisible();
    expect(dangerLink).not.toBeInTheDocument();
  });

  it('omits the leaf on an unmatched route, making the tenant name the current item', () => {
    vi.mocked(usePathname).mockReturnValue(
      `${adminRoutes.tenantOverview(MOCK_TENANT_ID)}/unlisted`,
    );

    setup();

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantLink = screen.queryByRole('link', { name: MOCK_TENANT_NAME });
    const featuresText = screen.queryByText(FEATURES);

    expect(tenantName).toBeVisible();
    expect(tenantLink).not.toBeInTheDocument();
    expect(featuresText).not.toBeInTheDocument();
  });

  it('shows Email as the current item on the email route, with the tenant name linked', () => {
    vi.mocked(usePathname).mockReturnValue(adminRoutes.email(MOCK_TENANT_ID));

    setup();

    const emailText = screen.getByText('Email');
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(emailText).toBeVisible();
    expect(tenantLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );
  });

  it('shows Studio as the current item on a Studio sub-route', () => {
    vi.mocked(usePathname).mockReturnValue(
      `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/structure/post`,
    );

    setup();

    const studioText = screen.getByText(STUDIO);
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(studioText).toBeVisible();
    expect(tenantLink).toBeVisible();
  });

  it('adds no Overview crumb on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue(
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );

    setup();

    const overviewText = screen.queryByText('Overview');

    expect(overviewText).not.toBeInTheDocument();
  });
});
