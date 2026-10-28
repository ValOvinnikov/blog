import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
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

const {
  getTenantByIdMock,
  getUnsentStudioReinviteEmailMock,
  clearUnsentStudioReinviteMock,
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  getUnsentStudioReinviteEmailMock: vi.fn(),
  clearUnsentStudioReinviteMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin');

vi.mock('@platform/server/owner-access/request-owner-access', () => ({
  enqueueOwnerAccessRequest: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      getUnsentStudioReinviteEmail: getUnsentStudioReinviteEmailMock,
      clearUnsentStudioReinvite: clearUnsentStudioReinviteMock,
    },
  },
}));

const requireAdminMock = vi.mocked(requireAdmin);
const enqueueOwnerAccessRequestMock = vi.mocked(enqueueOwnerAccessRequest);

describe(resendChangedOwnerStudioInviteAction, () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockReadyTenant());
    getUnsentStudioReinviteEmailMock.mockReset();
    getUnsentStudioReinviteEmailMock.mockResolvedValue(MOCK_OWNER_EMAIL);
    clearUnsentStudioReinviteMock.mockReset();
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
      resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });

  it('re-sends the Studio invite with the former owner email it stored, then forgets it', async () => {
    const result = await resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID);

    expect(enqueueOwnerAccessRequestMock).toHaveBeenCalledExactlyOnceWith(
      OWNER_INVITE_RESEND_PATH,
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );
    expect(clearUnsentStudioReinviteMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('re-sends without a former owner email when none is stored', async () => {
    getUnsentStudioReinviteEmailMock.mockResolvedValue(null);

    await resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID);

    expect(enqueueOwnerAccessRequestMock).toHaveBeenCalledExactlyOnceWith(
      OWNER_INVITE_RESEND_PATH,
      MOCK_TENANT_ID,
      undefined,
    );
  });

  it('keeps the stored email and reports a failed request', async () => {
    enqueueOwnerAccessRequestMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const result = await resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID);

    expect(clearUnsentStudioReinviteMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
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

    const result = await resendChangedOwnerStudioInviteAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });
});
