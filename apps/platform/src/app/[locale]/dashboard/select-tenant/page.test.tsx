import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SelectTenantPage from './page';

const { listMembershipsWithTenantsForUserMock, getAdminByUserIdMock } =
  vi.hoisted(() => ({
    listMembershipsWithTenantsForUserMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(SelectTenantPage, {});

describe(`<${SelectTenantPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
  });

  it('redirects to /onboarding with zero memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
  });

  it('redirects straight to /dashboard for exactly one membership — nothing to pick', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: MOCK_TENANT_ID },
        tenant: { id: MOCK_TENANT_ID },
      },
    ]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboard());
  });

  it('renders the picker for multiple memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: MOCK_TENANT_ID },
        tenant: { id: MOCK_TENANT_ID, name: MOCK_TENANT_NAME },
      },
      {
        membership: {
          id: 'm-2',
          userId: 'user-1',
          tenantId: MOCK_OTHER_TENANT_ID,
        },
        tenant: { id: MOCK_OTHER_TENANT_ID, name: MOCK_OTHER_TENANT_NAME },
      },
    ]);

    await setup();

    const heading = screen.getByRole('heading', { name: 'Choose a workspace' });

    expect(heading).toBeVisible();
  });
});
