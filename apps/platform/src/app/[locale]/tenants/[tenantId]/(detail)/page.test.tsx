import { AUDIT_TARGET_TYPE } from '@blog/config';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import TenantOverviewPage from './page';

const {
  authMock,
  listTenantsByIdsMock,
  getTenantOwnerEmailMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  getDomainVerificationStatusMock,
  getAdminByUserIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    memberships: {
      getTenantOwnerEmail: getTenantOwnerEmailMock,
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: vi.fn(),
  }),
);

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const setup = customRenderAsync(TenantOverviewPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantOverviewPage, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    listTenantsByIdsMock.mockReset();
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date('2026-08-12T00:00:00.000Z'),
    });
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue('NOT_CONFIGURED');
  });

  it('renders the overview for the resolved tenant', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(tenant.id);
    expect(getTenantOwnerMembershipMock).toHaveBeenCalledWith(tenant.id);
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      tenant.id,
      { limit: 5 },
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
  });

  it('formats and passes the owner membership join date to the Joined row', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(screen.getByText('Joined')).toBeVisible();
    const joinedTime = screen.getByText('Aug 12, 2026');
    expect(joinedTime).toBeVisible();
    expect(joinedTime).toHaveAttribute('dateTime', '2026-08-12T00:00:00.000Z');
  });

  it('omits the Joined row when the owner is still a pending invite', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getTenantOwnerEmailMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('always shows "Open site", pointing at the tenant\'s live domain', async () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'MODERATOR',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByRole('link', { name: 'Open site ↗' })).toHaveAttribute(
      'href',
      'https://acme.example.com',
    );
  });

  it('shows "Open Studio" only for a super admin viewer', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'SUPERADMIN',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByRole('link', { name: 'Open Studio ↗' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1/studio',
    );
  });

  it('hides "Open Studio" for a plain ADMIN/MODERATOR viewer', async () => {
    const tenant = makeTenant({ slug: 'acme' });
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'Open Studio ↗' }),
    ).not.toBeInTheDocument();
  });
});
