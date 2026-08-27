import { usePathname } from '@admin/i18n/navigation';
import {
  customRenderAsync,
  screen,
  within,
} from '@admin/testing/custom-render';
import { redirect } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import PlatformLayout from './layout';

const { authMock, getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

// `PlatformBreadcrumb` links through `@admin/i18n/navigation`'s
// `Link`/`usePathname` — mocked the same way as `sidebar.test.tsx`.
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

const setup = customRenderAsync(PlatformLayout, {
  children: <div>content</div>,
  params: Promise.resolve({}),
});

describe(`<${PlatformLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    vi.mocked(redirect).mockClear();
    vi.mocked(usePathname).mockReturnValue('/tenants');
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/unauthorized');
  });

  it('renders the gated content for a signed-in admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByText('content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it("renders the tenant's name as the breadcrumb's current item on the tenant overview route", async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1');

    await setup({ params: Promise.resolve({ tenantId: 'tenant-1' }) });

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByText('Acme Inc.')).toBeVisible();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumb).getByRole('link', { name: 'Tenants' }),
    ).toHaveAttribute('href', '/tenants');
  });

  it('renders a 4-segment trail with a linked tenant name on the provisioning route', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    vi.mocked(usePathname).mockReturnValue('/tenants/tenant-1/provisioning');

    await setup({ params: Promise.resolve({ tenantId: 'tenant-1' }) });

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumb).getByRole('link', { name: 'Acme Inc.' }),
    ).toHaveAttribute('href', '/tenants/tenant-1');
    expect(within(breadcrumb).getByText('Provisioning')).toBeVisible();
  });
});
