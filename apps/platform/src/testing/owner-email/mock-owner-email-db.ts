import { mockDbConstants } from '@platform/testing/mock-db-constants';

export const getTenantByIdMock = vi.fn();
export const getTenantOwnerEmailMock = vi.fn();

export const mockOwnerEmailDb = async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
});
