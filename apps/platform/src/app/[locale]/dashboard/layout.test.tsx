import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLayout from './layout';

const { listMembershipsWithTenantsForUserMock } = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: vi.fn().mockResolvedValue(undefined) },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(DashboardLayout, {
  children: <div>dashboard content</div>,
});

describe(`<${DashboardLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /onboarding when the signed-in user has zero memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/onboarding');
  });

  it('renders the gated content for any membership without resolving a single tenant', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: MOCK_TENANT_ID },
        tenant: { id: MOCK_TENANT_ID },
      },
      {
        membership: { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2' },
        tenant: { id: 'tenant-2' },
      },
    ]);

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
