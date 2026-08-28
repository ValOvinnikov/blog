import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import TenantDomainPage from './page';

const {
  authMock,
  getAdminByUserIdMock,
  getTenantByIdMock,
  getDomainVerificationStatusMock,
  getDomainDnsRecordsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  getDomainDnsRecordsMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

vi.mock('@admin/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('@admin/server/provisioning/get-domain-dns-records', () => ({
  getDomainDnsRecords: getDomainDnsRecordsMock,
}));

const setup = customRenderAsync(TenantDomainPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(`<${TenantDomainPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockReset();
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue('PENDING');
    getDomainDnsRecordsMock.mockReset();
    getDomainDnsRecordsMock.mockResolvedValue([
      { type: 'A', name: '@', value: '76.76.21.21' },
    ]);
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders the domain page heading, live status, and DNS records table', async () => {
    const tenant = makeTenant({
      id: 'tenant-1',
      primaryDomain: 'northwind.dev',
    });
    getTenantByIdMock.mockResolvedValue(tenant);

    await setup();

    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'northwind.dev',
    );
    expect(getDomainDnsRecordsMock).toHaveBeenCalledWith('northwind.dev');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Domain' }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('76.76.21.21')).toBeVisible();
  });
});
