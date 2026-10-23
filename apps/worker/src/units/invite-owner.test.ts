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
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';
import { getStepMetadata } from 'workflow';

import { inviteOwner } from './invite-owner';

const INVITED_TENANT = mockProvisionedTenant();

vi.mock('@worker/utils/owner-email/send-owner-email');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock(import('workflow'), async (importOriginal) => ({
  ...(await importOriginal()),
  getStepMetadata: vi.fn(),
}));

describe(inviteOwner, () => {
  beforeEach(() => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 1,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(getTenantById).mockResolvedValue(INVITED_TENANT);
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
      mockOwnerAccessTarget(INVITED_TENANT),
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
      vi.mocked(getStepMetadata).mockReturnValue({
        attempt: 99,
      } as ReturnType<typeof getStepMetadata>);

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
