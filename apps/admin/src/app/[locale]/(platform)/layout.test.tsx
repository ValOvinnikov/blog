import { usePathname } from '@admin/i18n/navigation';
import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { notFound, redirect, useParams } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import PlatformLayout from './layout';

const { authMock, getAdminByUserIdMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
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

// Widens the global `next/navigation` mock (`vitest-setup.ts`) with
// `useParams`, which `PlatformBreadcrumb` now reads directly — that mock is
// total, so a test needing an export it doesn't already stub must add it here.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useParams: vi.fn(() => ({})),
}));

const setup = customRenderAsync(PlatformLayout, {
  children: <div>content</div>,
});

describe(`<${PlatformLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
    vi.mocked(notFound).mockClear();
    vi.mocked(usePathname).mockReturnValue('/tenants');
    vi.mocked(useParams).mockReturnValue({});
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
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
  });
});
