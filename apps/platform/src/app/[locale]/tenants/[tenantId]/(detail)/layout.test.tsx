import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import TenantDetailLayout from './layout';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  resolveIsSidebarCollapsedMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed', () => ({
  resolveIsSidebarCollapsed: resolveIsSidebarCollapsedMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(TenantDetailLayout, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  children: <div>tenant content</div>,
});

describe(`<${TenantDetailLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: ADMIN_ROLE.ADMIN,
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      name: MOCK_TENANT_NAME,
      primaryDomain: MOCK_TENANT_DOMAIN,
    });
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the gated content for a platform operator', async () => {
    await setup();

    const content = screen.getByText('tenant content');

    expect(content).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders both the Platform and Tenant sections in the sidebar', async () => {
    await setup();

    const platformSection = screen.getByText('Platform', { selector: 'p' });
    const tenantSection = screen.getByText(`Tenant · ${MOCK_TENANT_NAME}`);

    expect(platformSection).toBeVisible();
    expect(tenantSection).toBeVisible();
  });

  it('renders no tenant switcher in the sidebar', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      slug: 'acme',
      name: MOCK_TENANT_NAME,
      primaryDomain: MOCK_TENANT_DOMAIN,
    });

    await setup();

    const tenantDomain = screen.queryByText(MOCK_TENANT_DOMAIN);

    expect(tenantDomain).not.toBeInTheDocument();
  });
});
