import { ACTION_OUTCOME, HTTP_STATUS } from '@blog/config';
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
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(action('tenant-1')).rejects.toThrow('NEXT_NOT_FOUND');

    expect(enqueueWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("admits only the tenant's owner or a super-admin", async () => {
    await action('tenant-1');

    const [tenantId, isAdminPermitted] = requireTenantOwnerOrAdminMock.mock
      .calls[0] as [string, (admin: { role: string }) => boolean];

    expect(tenantId).toBe('tenant-1');
    expect(isAdminPermitted({ role: 'SUPERADMIN' })).toBe(true);
    expect(isAdminPermitted({ role: 'ADMIN' })).toBe(false);
  });

  it('succeeds once the worker accepts the request', async () => {
    const result = await action('tenant-1');

    expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(path, 'tenant-1');
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('logs and fails when the worker answers anything else', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(HTTP_STATUS.CONFLICT);

    const result = await action('tenant-1');

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'owner_access.request_failed',
      { tenantId: 'tenant-1', path, responseStatus: HTTP_STATUS.CONFLICT },
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('fails without a second log when the request never reached the worker', async () => {
    enqueueWorkerRequestMock.mockResolvedValue(null);

    const result = await action('tenant-1');

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
