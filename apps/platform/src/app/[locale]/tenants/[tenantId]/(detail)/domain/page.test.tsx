import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { auth } from '@platform/server/auth/auth';
import {
  act,
  customRenderAsync,
  screen,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant, TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

import TenantDomainPage from './page';

const { getAdminByUserIdMock, getTenantByIdMock, getProjectDomainMock } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getProjectDomainMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: getProjectDomainMock,
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(TenantDomainPage, {
  params: Promise.resolve({ tenantId: TENANT_ID }),
});

const VERCEL_A_RECORD = '76.76.21.21';
const NORTHWIND_DEV = 'northwind.dev';

describe(`<${TenantDomainPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.ADMIN,
    });
    getTenantByIdMock.mockReset();
    getProjectDomainMock.mockReset();
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: VERCEL_A_RECORD }],
    });
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('renders the domain page heading, live status, and DNS records table', async () => {
    const tenant = makeTenant({
      id: TENANT_ID,
      primaryDomain: NORTHWIND_DEV,
    });
    getTenantByIdMock.mockResolvedValue(tenant);

    await act(async () => {
      await setup();
    });

    expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(NORTHWIND_DEV);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Domain' }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText(VERCEL_A_RECORD)).toBeVisible();
  });
});
