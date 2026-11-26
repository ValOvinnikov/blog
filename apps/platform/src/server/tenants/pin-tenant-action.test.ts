import { faker } from '@faker-js/faker';
import {
  TENANT_LOG,
  TENANT_REFUSAL,
  TENANTS_LIST_ROUTE,
} from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { revalidatePath } from 'next/cache';

import { pinTenantAction } from './pin-tenant-action';

faker.seed(8079);

const { pinTenantMock } = vi.hoisted(() => ({ pinTenantMock: vi.fn() }));

vi.mock('next/cache');

vi.mock('@platform/server/auth/require-admin');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { pinnedTenants: { pinTenant: pinTenantMock } },
}));

const MOCK_MALFORMED_TENANT_ID = faker.lorem.word();
const MOCK_OTHER_ERROR = ERROR_CODE.DB_LAST_LINKED_METHOD;
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());

describe(pinTenantAction, () => {
  beforeEach(() => {
    pinTenantMock.mockResolvedValue(okResult());
  });

  it('pins the tenant for the admin row, not the user, and refreshes the list', async () => {
    const result = await pinTenantAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(pinTenantMock).toHaveBeenCalledWith(mockAdmin().id, MOCK_TENANT_ID);
    expect(revalidatePath).toHaveBeenCalledWith(TENANTS_LIST_ROUTE, 'page');
  });

  it('refuses a caller who is not an admin before touching the pins', async () => {
    vi.mocked(requireAdmin).mockImplementationOnce(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(pinTenantAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(pinTenantMock).not.toHaveBeenCalled();
  });

  it('refuses a malformed tenant id without calling the query', async () => {
    const result = await pinTenantAction(MOCK_MALFORMED_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(pinTenantMock).not.toHaveBeenCalled();
  });

  it('refuses a tenant that no longer exists', async () => {
    pinTenantMock.mockResolvedValueOnce(errorResult(ERROR_CODE.DB_NOT_FOUND));

    const result = await pinTenantAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('logs any other failure once and reports a server error', async () => {
    pinTenantMock.mockResolvedValueOnce(errorResult(MOCK_OTHER_ERROR));

    const result = await pinTenantAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(TENANT_LOG.PIN_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_OTHER_ERROR,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('logs a thrown failure once and reports a server error', async () => {
    pinTenantMock.mockRejectedValueOnce(MOCK_DB_ERROR);

    const result = await pinTenantAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(TENANT_LOG.PIN_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_DB_ERROR.name,
      errorCode: undefined,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
