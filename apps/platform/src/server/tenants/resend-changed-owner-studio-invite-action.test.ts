import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockReadyTenant,
  mockTenant,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { resendChangedOwnerStudioInviteAction } from './resend-changed-owner-studio-invite-action';

const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin');

vi.mock('@platform/server/owner-access/request-owner-access', () => ({
  enqueueOwnerAccessRequest: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { getTenantById: getTenantByIdMock } },
}));

const requireAdminMock = vi.mocked(requireAdmin);
const enqueueOwnerAccessRequestMock = vi.mocked(enqueueOwnerAccessRequest);

describe(resendChangedOwnerStudioInviteAction, () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockReadyTenant());
    enqueueOwnerAccessRequestMock.mockReset();
    enqueueOwnerAccessRequestMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it('requires an admin session before requesting anything', async () => {
    requireAdminMock.mockImplementationOnce(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID, MOCK_OWNER_EMAIL),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });

  it('re-sends the Studio invite with the former owner email', async () => {
    const result = await resendChangedOwnerStudioInviteAction(
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );

    expect(enqueueOwnerAccessRequestMock).toHaveBeenCalledExactlyOnceWith(
      OWNER_INVITE_RESEND_PATH,
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('passes a failed request back to the caller', async () => {
    enqueueOwnerAccessRequestMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const result = await resendChangedOwnerStudioInviteAction(
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('rejects a former owner email that is not an address', async () => {
    const result = await resendChangedOwnerStudioInviteAction(
      MOCK_TENANT_ID,
      MOCK_TENANT_ID,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        formerOwnerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
      },
    });
    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing or archived tenant', undefined, TENANT_REFUSAL.NOT_FOUND],
    [
      'a tenant with no Sanity project',
      mockTenant(),
      TENANT_REFUSAL.STUDIO_NOT_PROVISIONED,
    ],
  ])('refuses %s', async (_case, tenant, reason) => {
    getTenantByIdMock.mockResolvedValue(tenant);

    const result = await resendChangedOwnerStudioInviteAction(
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });
});
