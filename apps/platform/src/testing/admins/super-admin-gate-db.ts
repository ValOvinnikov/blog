import { mockDbConstants } from '@platform/testing/mock-db-constants';

export const mockSuperAdminGateDb = async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: vi.fn() } },
});
