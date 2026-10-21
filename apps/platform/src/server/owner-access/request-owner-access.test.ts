import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { checkOwnerAccessAction } from './check-owner-access-action';
import { resendOwnerInviteAction } from './resend-owner-invite-action';

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

vi.mock('@platform/utils/logger/logger');

const { id: tenantId } = makeTenant();

const loggerErrorMock = vi.mocked(logger.error);

describe.each([
  ['checkOwnerAccessAction', checkOwnerAccessAction, '/api/owner-access/check'],
  [
    'resendOwnerInviteAction',
    resendOwnerInviteAction,
    '/api/owner-access/resend',
  ],
] as const)('%s', (_name, action, path) => {
  beforeEach(() => {
    requireTenantOwnerOrAdminMock.mockReset();
    requireTenantOwnerOrAdminMock.mockResolvedValue(undefined);
    enqueueWorkerRequestMock.mockReset();
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.ACCEPTED);
    loggerErrorMock.mockReset();
  });

  it('calls nothing on the worker for a caller the gate refuses', async () => {
    requireTenantOwnerOrAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(action(tenantId)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(enqueueWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("admits only the tenant's owner or a super-admin", async () => {
    await action(tenantId);

    const [gatedTenantId, isAdminPermitted] = requireTenantOwnerOrAdminMock.mock
      .calls[0] as [string, (admin: TAdmin) => boolean];

    expect(gatedTenantId).toBe(tenantId);
    expect(isAdminPermitted(makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }))).toBe(
      true,
    );
    expect(isAdminPermitted(makeAdmin())).toBe(false);
  });

  it('succeeds once the worker accepts the request', async () => {
    const result = await action(tenantId);

    expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(path, tenantId);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('logs and fails when the worker answers anything else', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.CONFLICT);

    const result = await action(tenantId);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'owner_access.request_failed',
      { tenantId, path, responseStatus: HTTP_STATUS.CONFLICT },
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('fails without a second log when the request never reached the worker', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(null);

    const result = await action(tenantId);

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
