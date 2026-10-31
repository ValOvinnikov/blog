import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { getTenantById, setTenantOwnerAccess } from '@blog/db/queries/tenants';
import {
  createSanityProjectInvite,
  listSanityProjectInvites,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { okResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_INVITE_SENT_AT,
  MOCK_OWNER_EMAIL,
  MOCK_SANITY_INVITE_ID,
  mockOwnerAccessTarget,
  mockPendingInvite,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';

import { inviteOwner } from './invite-owner';

const MOCK_INVITED_TENANT = mockProvisionedTenant();

vi.mock('@worker/utils/owner-email/send-owner-email');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('workflow');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');

describe(inviteOwner, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(MOCK_INVITED_TENANT);
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([
      mockPendingInvite(),
    ]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue(okResult({} as never));
  });

  it("records the owner's pending invite without sending a second one", async () => {
    const result = await inviteOwner(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(createSanityProjectInvite).not.toHaveBeenCalled();
    expect(setTenantOwnerAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      sanityInviteId: MOCK_SANITY_INVITE_ID,
      inviteSentAt: new Date(MOCK_INVITE_SENT_AT),
      inviteAcceptedAt: null,
    });
  });

  it('sends the invite when the owner has none', async () => {
    vi.mocked(listSanityProjectInvites)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockPendingInvite()]);

    await inviteOwner(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(createSanityProjectInvite).toHaveBeenCalledOnce();
  });

  it('sends the owner the invite heads-up once the invite is recorded', async () => {
    await inviteOwner(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(sendOwnerEmailOnce).toHaveBeenCalledWith(
      mockOwnerAccessTarget(MOCK_INVITED_TENANT),
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
    );
  });

  describe('when the invite cannot be sent', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectInvites).mockRejectedValue(
        new Error(MOCK_SANITY_OUTAGE),
      );
    });

    it('retries before its last attempt', async () => {
      await expect(
        inviteOwner(MOCK_TENANT_ID, MOCK_RUN_CONTEXT),
      ).rejects.toThrow(MOCK_SANITY_OUTAGE);
    });

    it('logs and lets provisioning carry on once the last attempt fails', async () => {
      atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);

      const result = await inviteOwner(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(logger.error).toHaveBeenCalledWith('owner_access.invite_failed', {
        tenantId: MOCK_TENANT_ID,
        runId: MOCK_RUN_CONTEXT.runId,
        error: MOCK_SANITY_OUTAGE,
      });
    });
  });
});
