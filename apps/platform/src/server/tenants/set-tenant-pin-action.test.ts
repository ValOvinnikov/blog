import {
  TENANT_LOG,
  TENANT_REFUSAL,
  TENANTS_LIST_PURGE_ARGS,
} from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_MALFORMED_TENANT_ID,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { revalidatePath } from 'next/cache';

import { setTenantPinAction } from './set-tenant-pin-action';

const { pinTenantMock, unpinTenantMock } = vi.hoisted(() => ({
  pinTenantMock: vi.fn(),
  unpinTenantMock: vi.fn(),
}));

vi.mock('next/cache');

vi.mock('@platform/server/auth/require-admin');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    pinnedTenants: { pinTenant: pinTenantMock, unpinTenant: unpinTenantMock },
  },
}));

const MOCK_OTHER_ERROR = ERROR_CODE.DB_LAST_LINKED_METHOD;
const MOCK_QUERY_ERROR = mockQueryError();
const NOT_FOUND_REFUSAL = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: TENANT_REFUSAL.NOT_FOUND,
};
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

const DIRECTIONS = [
  {
    direction: 'pinning',
    isPinned: true,
    writePin: pinTenantMock,
    failedEvent: TENANT_LOG.PIN_FAILED,
  },
  {
    direction: 'unpinning',
    isPinned: false,
    writePin: unpinTenantMock,
    failedEvent: TENANT_LOG.UNPIN_FAILED,
  },
];

describe(setTenantPinAction, () => {
  beforeEach(() => {
    pinTenantMock.mockResolvedValue(okResult());
  });

  it.each(DIRECTIONS)(
    'saves $direction for the admin row and refreshes the list',
    async ({ isPinned, writePin }) => {
      const result = await setTenantPinAction(MOCK_TENANT_ID, isPinned);

      expect(result).toEqual(toOutcome(ACTION_OUTCOME.SUCCESS));
      expect(writePin).toHaveBeenCalledWith(mockAdmin().id, MOCK_TENANT_ID);
      expect(revalidatePath).toHaveBeenCalledWith(...TENANTS_LIST_PURGE_ARGS);
    },
  );

  it.each(DIRECTIONS)(
    'refuses a caller who is not an admin before $direction',
    async ({ isPinned, writePin }) => {
      vi.mocked(requireAdmin).mockRejectedValueOnce(
        new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
      );

      await expect(
        setTenantPinAction(MOCK_TENANT_ID, isPinned),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
      expect(writePin).not.toHaveBeenCalled();
    },
  );

  it.each(DIRECTIONS)(
    'refuses a malformed tenant id without $direction',
    async ({ isPinned, writePin }) => {
      const result = await setTenantPinAction(
        MOCK_MALFORMED_TENANT_ID,
        isPinned,
      );

      expect(result).toEqual(NOT_FOUND_REFUSAL);
      expect(writePin).not.toHaveBeenCalled();
    },
  );

  it.each(DIRECTIONS)(
    'logs a failure thrown while $direction once and leaves the list alone',
    async ({ isPinned, writePin, failedEvent }) => {
      writePin.mockRejectedValueOnce(MOCK_QUERY_ERROR);

      const result = await setTenantPinAction(MOCK_TENANT_ID, isPinned);

      expect(result).toEqual(SERVER_ERROR);
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error).toHaveBeenCalledWith(failedEvent, {
        tenantId: MOCK_TENANT_ID,
        errorName: MOCK_QUERY_ERROR_NAME,
        errorCode: MOCK_POSTGRES_ERROR_CODE,
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('refuses to pin a tenant that no longer exists', async () => {
    pinTenantMock.mockResolvedValueOnce(errorResult(ERROR_CODE.DB_NOT_FOUND));

    const result = await setTenantPinAction(MOCK_TENANT_ID, true);

    expect(result).toEqual(NOT_FOUND_REFUSAL);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('logs any other pin failure once and reports a server error', async () => {
    pinTenantMock.mockResolvedValueOnce(errorResult(MOCK_OTHER_ERROR));

    const result = await setTenantPinAction(MOCK_TENANT_ID, true);

    expect(result).toEqual(SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(TENANT_LOG.PIN_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_OTHER_ERROR,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
