import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import DashboardDomainPage from './page';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  getDomainVerificationStatusMock,
  getDomainDnsRecordsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  getDomainDnsRecordsMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@admin/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('@admin/server/provisioning/get-domain-dns-records', () => ({
  getDomainDnsRecords: getDomainDnsRecordsMock,
}));

const setup = customRenderAsync(DashboardDomainPage, {});

describe(`<${DashboardDomainPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockReset();
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue('PENDING');
    getDomainDnsRecordsMock.mockReset();
    getDomainDnsRecordsMock.mockResolvedValue([
      { type: 'A', name: '@', value: '76.76.21.21' },
    ]);
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without resolving a tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's domain, live status, and DNS records table", async () => {
    const tenant = makeTenant({
      id: 'tenant-1',
      primaryDomain: 'northwind.dev',
    });
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'northwind.dev',
    );
    expect(getDomainDnsRecordsMock).toHaveBeenCalledWith('northwind.dev');
    expect(
      screen.getByRole('heading', { level: 1, name: 'northwind.dev' }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('76.76.21.21')).toBeVisible();
  });
});
