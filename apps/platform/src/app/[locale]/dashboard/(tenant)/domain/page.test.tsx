import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { auth } from '@platform/server/auth/auth';
import {
  act,
  customRenderAsync,
  screen,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenant,
  MOCK_TENANT_ID,
  MOCK_VERCEL_A_RECORD,
  MOCK_CUSTOM_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardDomainPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getProjectDomainMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getProjectDomainMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: getProjectDomainMock,
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};

const setup = customRenderAsync(DashboardDomainPage, {});

describe(`<${DashboardDomainPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getProjectDomainMock.mockReset();
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  it('redirects to sign-in without resolving a tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/sign-in?callbackUrl=%2F');
    expect(getProjectDomainMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's domain, live status, and DNS records table", async () => {
    const tenant = mockTenant({
      id: MOCK_TENANT_ID,
      primaryDomain: MOCK_CUSTOM_DOMAIN,
    });
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant },
    ]);

    await act(async () => {
      await setup();
    });

    expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_CUSTOM_DOMAIN,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Domain' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Point ${MOCK_CUSTOM_DOMAIN} at us`,
      }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText(MOCK_VERCEL_A_RECORD)).toBeVisible();
  });
});
