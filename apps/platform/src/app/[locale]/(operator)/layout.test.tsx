import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { usePathname } from '@platform/i18n/navigation';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { redirect, useParams } from 'next/navigation';
import type { Session } from 'next-auth';

import OperatorLayout from './layout';

const { getAdminByUserIdMock, resolveIsSidebarCollapsedMock, CONTRAST_DUE } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    resolveIsSidebarCollapsedMock: vi.fn(),
    CONTRAST_DUE: 'Contrast check due',
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed', () => ({
  resolveIsSidebarCollapsed: resolveIsSidebarCollapsedMock,
}));

vi.mock('@blog/db', () => ({
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/components/features/releases/contrast-due-banner', () => ({
  ContrastDueBanner: () => <p>{CONTRAST_DUE}</p>,
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(OperatorLayout, {
  children: <div>content</div>,
});

describe(`<${OperatorLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    vi.mocked(usePathname).mockReturnValue('/tenants');
    vi.mocked(useParams).mockReturnValue({});
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/sign-in?callbackUrl=%2F',
    );
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it('renders the gated content for a signed-in admin', async () => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());

    await setup();

    expect(screen.getByText('content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('hides the Releases nav entry from an ADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.ADMIN }),
    );

    await setup();

    expect(
      screen.queryByRole('link', { name: 'Releases' }),
    ).not.toBeInTheDocument();
  });

  it('puts Releases in the breadcrumb only for a SUPERADMIN', async () => {
    vi.mocked(usePathname).mockReturnValue('/releases');
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.ADMIN }),
    );

    await setup();

    expect(screen.queryByText('Releases')).not.toBeInTheDocument();
  });

  it('shows the Releases nav entry to a SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );

    await setup();

    expect(screen.getByRole('link', { name: 'Releases' })).toHaveAttribute(
      'href',
      '/releases',
    );
  });
  it('shows the contrast-due banner slot to a SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );

    await setup();

    expect(screen.getByText(CONTRAST_DUE)).toBeVisible();
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'never shows the contrast-due banner to an %s',
    async (role) => {
      getAdminByUserIdMock.mockResolvedValue(mockAdmin({ role }));

      await setup();

      expect(screen.getByText('content')).toBeVisible();
      expect(screen.queryByText(CONTRAST_DUE)).not.toBeInTheDocument();
    },
  );
});
