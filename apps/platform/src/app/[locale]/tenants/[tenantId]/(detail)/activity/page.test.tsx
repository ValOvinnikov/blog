import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { MOCK_OPERATOR_ID } from '@platform/testing/admins/operator';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant, MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

import TenantActivityPage from './page';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  listAuditEventsForTargetMock,
  countAuditEventsForTargetMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  countAuditEventsForTargetMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    auditEvents: {
      listAuditEventsForTarget: listAuditEventsForTargetMock,
      countAuditEventsForTarget: countAuditEventsForTargetMock,
    },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(TenantActivityPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  searchParams: Promise.resolve({}),
});

describe(`<${TenantActivityPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: faker.string.uuid() } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({
      id: MOCK_OPERATOR_ID,
      role: ADMIN_ROLE.ADMIN,
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant({ id: MOCK_TENANT_ID }));
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    countAuditEventsForTargetMock.mockReset();
    countAuditEventsForTargetMock.mockResolvedValue(0);
  });

  it('404s for a signed-in tenant member with no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(listAuditEventsForTargetMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it("renders the tenant's activity page for an admin", async () => {
    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Activity' }),
    ).toBeVisible();
  });
});
