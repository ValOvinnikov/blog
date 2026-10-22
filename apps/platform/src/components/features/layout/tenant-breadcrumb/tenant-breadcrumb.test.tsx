import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

const render = renderWithIntl;

const DANGER_ZONE = 'Danger zone';

describe(TenantBreadcrumb, () => {
  it('renders Platform and a linked Tenants ancestor, plus a linked tenant name', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/look`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Platform' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      `/tenants/${TENANT_ID}`,
    );
  });

  it('shows the tenant name as the unlinked current item on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Acme Inc.' })).toBeNull();
  });

  it('shows Look as the current item on the look route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/look`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Look')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Look' })).toBeNull();
  });

  it('shows Voice as the current item on the voice route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/voice`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Voice')).toBeVisible();
  });

  it('shows Features as the current item on the features route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/features`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Features')).toBeVisible();
  });

  it('shows Domain as the current item on the domain route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/domain`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Domain')).toBeVisible();
  });

  it('shows Studio as the current item on the studio route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/studio`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Studio')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Studio' })).toBeNull();
  });

  it('shows Provisioning as the current item on the provisioning route', () => {
    vi.mocked(usePathname).mockReturnValue(
      `/tenants/${TENANT_ID}/provisioning`,
    );

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Provisioning')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Provisioning' })).toBeNull();
  });

  it('shows Danger zone as the current item on the danger route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/danger`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText(DANGER_ZONE)).toBeVisible();
    expect(screen.queryByRole('link', { name: DANGER_ZONE })).toBeNull();
  });

  it('omits the leaf on an unmatched route, making the tenant name the current item', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/unlisted`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Acme Inc.' })).toBeNull();
    expect(screen.queryByText('Features')).not.toBeInTheDocument();
  });

  it('shows Email as the current item on the email route, with the tenant name linked', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}/email`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Email')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      `/tenants/${TENANT_ID}`,
    );
  });

  it('shows Studio as the current item on a Studio sub-route', () => {
    vi.mocked(usePathname).mockReturnValue(
      `/tenants/${TENANT_ID}/studio/structure/post`,
    );

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.getByText('Studio')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toBeVisible();
  });

  it('adds no Overview crumb on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue(`/tenants/${TENANT_ID}`);

    render(<TenantBreadcrumb tenantId={TENANT_ID} tenantName="Acme Inc." />);

    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });
});
