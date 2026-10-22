import { itGatesToSuperAdmins } from '@platform/testing/admins/super-admin-layout-gate';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import DataRequestsLayout from './layout';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

describe(DataRequestsLayout, () => {
  itGatesToSuperAdmins(DataRequestsLayout, getAdminByUserIdMock);
});
