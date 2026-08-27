import { usePathname } from '@admin/i18n/navigation';
import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { useParams } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import { PlatformBreadcrumb } from './platform-breadcrumb';

const { getTenantNameActionMock } = vi.hoisted(() => ({
  getTenantNameActionMock: vi.fn(),
}));

// Links through `@admin/i18n/navigation`'s `Link`/`usePathname`, mocked the
// same way as `sidebar.test.tsx`/`topbar-nav-menu.test.tsx`.
vi.mock('@admin/i18n/navigation', () => ({
  usePathname: vi.fn(() => '/tenants'),
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

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({})),
}));

vi.mock('@admin/server/tenants/get-tenant-name-action', () => ({
  getTenantNameAction: getTenantNameActionMock,
}));

const render = renderWithIntl;

describe(PlatformBreadcrumb, () => {
  beforeEach(() => {
    getTenantNameActionMock.mockReset();
    vi.mocked(useParams).mockReturnValue({});
  });

  it('renders the 2-segment trail on the tenants list, with Tenants as the current item', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants');

    render(<PlatformBreadcrumb />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Platform' })).toBeNull();
    expect(screen.getByText('Tenants')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Tenants' })).toBeNull();
    expect(getTenantNameActionMock).not.toHaveBeenCalled();
  });

  it('renders a 3-segment trail with a linked Tenants on the add-tenant route', () => {
    vi.mocked(usePathname).mockReturnValue('/add-tenant');

    render(<PlatformBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(screen.getByText('Add tenant')).toBeVisible();
  });

  it('renders the tenant name as the current item on the tenant overview route', async () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1');
    vi.mocked(useParams).mockReturnValue({ tenantId: 'tenant-1' });
    getTenantNameActionMock.mockResolvedValue('Acme Inc.');

    render(<PlatformBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(await screen.findByText('Acme Inc.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Acme Inc.' })).toBeNull();
    expect(getTenantNameActionMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders a 4-segment trail with a linked tenant name on the provisioning route', async () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/provisioning');
    vi.mocked(useParams).mockReturnValue({ tenantId: 'tenant-1' });
    getTenantNameActionMock.mockResolvedValue('Acme Inc.');

    render(<PlatformBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(
      await screen.findByRole('link', { name: 'Acme Inc.' }),
    ).toHaveAttribute('href', '/tenants/tenant-1');
    expect(screen.getByText('Provisioning')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Provisioning' })).toBeNull();
  });
});
