import { usePathname } from '@platform/i18n/navigation';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { redirect, useParams } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import OperatorLayout from './layout';

const { authMock, getAdminByUserIdMock, resolveIsSidebarCollapsedMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    resolveIsSidebarCollapsedMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed', () => ({
  resolveIsSidebarCollapsed: resolveIsSidebarCollapsedMock,
}));

vi.mock('@blog/db', () => ({
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

vi.mock('@platform/i18n/navigation', () => ({
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
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useParams: vi.fn(() => ({})),
  useSelectedLayoutSegment: vi.fn(() => null),
}));

const setup = customRenderAsync(OperatorLayout, {
  children: <div>content</div>,
});

describe(`<${OperatorLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
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
