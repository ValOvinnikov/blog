import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import { faker } from '@faker-js/faker';
import { OWNER_ACCESS_LOG } from '@platform/constants/owner-access';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { checkOwnerAccessAction } from './check-owner-access-action';
import { requestOwnerAccess } from './request-owner-access';
import { resendOwnerInviteAction } from './resend-owner-invite-action';

faker.seed(6105);

const { requireTenantOwnerOrAdminMock, enqueueWorkerRequestMock } = vi.hoisted(
  () => ({
    requireTenantOwnerOrAdminMock: vi.fn(),
    enqueueWorkerRequestMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/require-tenant-owner-or-admin', () => ({
  requireTenantOwnerOrAdmin: requireTenantOwnerOrAdminMock,
}));

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueWorkerRequest: enqueueWorkerRequestMock,
}));

const MOCK_WORKER_PATH = `/${faker.lorem.slug()}`;

describe(requestOwnerAccess, () => {
  beforeEach(() => {
    requireTenantOwnerOrAdminMock.mockReset();
    requireTenantOwnerOrAdminMock.mockResolvedValue(undefined);
    enqueueWorkerRequestMock.mockReset();
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it('calls nothing on the worker for a caller the gate refuses', async () => {
    requireTenantOwnerOrAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(
      requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(enqueueWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("admits only the tenant's owner or a super-admin", async () => {
    await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    const [gatedTenantId, isAdminPermitted] = requireTenantOwnerOrAdminMock.mock
      .calls[0] as [string, (admin: TAdmin) => boolean];

    expect(gatedTenantId).toBe(MOCK_TENANT_ID);
    expect(isAdminPermitted(mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }))).toBe(
      true,
    );
    expect(isAdminPermitted(mockAdmin())).toBe(false);
  });

  it('succeeds once the worker accepts the request', async () => {
    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(
      MOCK_WORKER_PATH,
      MOCK_TENANT_ID,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('logs and fails when the worker answers anything else', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.CONFLICT);

    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(logger.error).toHaveBeenCalledWith(OWNER_ACCESS_LOG.REQUEST_FAILED, {
      tenantId: MOCK_TENANT_ID,
      path: MOCK_WORKER_PATH,
      responseStatus: HTTP_STATUS.CONFLICT,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('fails without a log when the request never reached the worker', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(null);

    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(logger.error).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});

describe('the owner-access actions', () => {
  beforeEach(() => {
    requireTenantOwnerOrAdminMock.mockReset();
    enqueueWorkerRequestMock.mockReset();
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it.each([
    [
      checkOwnerAccessAction.name,
      checkOwnerAccessAction,
      '/api/owner-access/check',
    ],
    [
      resendOwnerInviteAction.name,
      resendOwnerInviteAction,
      '/api/owner-access/resend',
    ],
  ])('%s requests its own worker path', async (_name, action, path) => {
    const result = await action(MOCK_TENANT_ID);

    expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(path, MOCK_TENANT_ID);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });
});
