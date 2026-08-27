import { usePathname } from '@admin/i18n/navigation';
import { renderWithIntl, screen } from '@admin/testing/custom-render';
import type { ComponentPropsWithoutRef } from 'react';

import { TenantBreadcrumb } from './tenant-breadcrumb';

vi.mock('@admin/i18n/navigation', () => ({
  usePathname: vi.fn(() => '/tenants/tenant-1/look'),
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

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

  it('shows the tenant name as the unlinked current item on the overview route, with no extra leaf', () => {
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
});
