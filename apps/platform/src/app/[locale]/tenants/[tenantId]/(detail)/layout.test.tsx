import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import TenantDetailLayout from './layout';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  resolveIsSidebarCollapsedMock,
  countUnreadLeadsForTenantMock,
} = vi.hoisted(() => ({
  countUnreadLeadsForTenantMock: vi.fn(),
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
    leads: { countUnreadLeadsForTenant: countUnreadLeadsForTenantMock },
  },
}));

const MOCK_TENANT_CONTENT = 'tenant content';
const MOCK_UNREAD_LEADS_COUNT = 2;

const setup = customRenderAsync(TenantDetailLayout, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  children: <div>{MOCK_TENANT_CONTENT}</div>,
});

describe(`<${TenantDetailLayout.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    countUnreadLeadsForTenantMock.mockResolvedValue(0);
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockReadyTenant());
  });

  it('redirects to sign-in when there is no session', async () => {
    vi.mocked<() => Promise<Session | null>>(auth).mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(redirect).not.toHaveBeenCalled();
  });

  describe('for a platform operator', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the gated content', () => {
      const content = screen.getByText(MOCK_TENANT_CONTENT);

      expect(content).toBeVisible();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('renders both the Platform and Tenant sections in the sidebar', () => {
      const platformSection = screen.getByText('Platform', { selector: 'p' });
      const tenantSection = screen.getByText(`Tenant · ${MOCK_TENANT_NAME}`);

      expect(platformSection).toBeVisible();
      expect(tenantSection).toBeVisible();
    });

    it('renders no tenant switcher in the sidebar', () => {
      const tenantDomain = screen.queryByText(MOCK_TENANT_DOMAIN);

      expect(tenantDomain).not.toBeInTheDocument();
    });
  });

  it("shows the tenant's unread lead count beside Leads", async () => {
    countUnreadLeadsForTenantMock.mockResolvedValue(MOCK_UNREAD_LEADS_COUNT);

    await setup();

    const leadsLink = screen.getByRole('link', { name: /Leads/ });

    expect(leadsLink).toHaveTextContent(`${MOCK_UNREAD_LEADS_COUNT} new`);
    expect(countUnreadLeadsForTenantMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });
});
