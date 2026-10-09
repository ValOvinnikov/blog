import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@platform/i18n/navigation');

const render = renderWithIntl;

describe(TenantBreadcrumb, () => {
  it('renders Platform and a linked Tenants ancestor, plus a linked tenant name', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/look');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Platform' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
  });

  it('shows the tenant name as the unlinked current item on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Acme Inc.' })).toBeNull();
  });

  it('shows Look as the current item on the look route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/look');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Look')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Look' })).toBeNull();
  });

  it('shows Voice as the current item on the voice route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/voice');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Voice')).toBeVisible();
  });

  it('shows Features as the current item on the features route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/features');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Features')).toBeVisible();
  });

  it('shows Domain as the current item on the domain route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/domain');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Domain')).toBeVisible();
  });

  it('shows Studio as the current item on the studio route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/studio');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Studio')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Studio' })).toBeNull();
  });

  it('shows Provisioning as the current item on the provisioning route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/provisioning');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Provisioning')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Provisioning' })).toBeNull();
  });

  it('shows Danger zone as the current item on the danger route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/danger');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Danger zone')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Danger zone' })).toBeNull();
  });

  it('omits the leaf on an unmatched route, making the tenant name the current item', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/unlisted');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Acme Inc.' })).toBeNull();
    expect(screen.queryByText('Features')).not.toBeInTheDocument();
  });

  it('shows Email as the current item on the email route, with the tenant name linked', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/email');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Email')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
  });

  it('shows Studio as the current item on a Studio sub-route', () => {
    vi.mocked(usePathname).mockReturnValue(
      '/tenants/tenant-1/studio/structure/post',
    );

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.getByText('Studio')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toBeVisible();
  });

  it('adds no Overview crumb on the overview route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1');

    render(<TenantBreadcrumb tenantId="tenant-1" tenantName="Acme Inc." />);

    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });
});
