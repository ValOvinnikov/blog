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
import {
  makeOwnerAccessTarget,
  OWNER_EMAIL,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';
import { getStepMetadata } from 'workflow';

import { inviteOwner } from './invite-owner';

const CTX = { runId: 'run-1' };
const SANITY_OUTAGE = '503';
const INVITED_TENANT = makeTenant({ sanityProjectId: SANITY_PROJECT_ID });
const PENDING_INVITE = {
  id: 'invite-1',
  email: OWNER_EMAIL,
  status: 'pending',
  createdAt: '2026-10-20T09:00:00.000Z',
};

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
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([PENDING_INVITE]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue(okResult({} as never));
  });

  it("records the owner's pending invite without sending a second one", async () => {
    const result = await inviteOwner(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(createSanityProjectInvite).not.toHaveBeenCalled();
    expect(setTenantOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, {
      sanityInviteId: 'invite-1',
      inviteSentAt: new Date(PENDING_INVITE.createdAt),
      inviteAcceptedAt: null,
    });
  });

  it('sends the invite when the owner has none', async () => {
    vi.mocked(listSanityProjectInvites)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([PENDING_INVITE]);

    await inviteOwner(TEST_TENANT_ID, CTX);

    expect(createSanityProjectInvite).toHaveBeenCalledOnce();
  });

  it('sends the owner the invite heads-up once the invite is recorded', async () => {
    await inviteOwner(TEST_TENANT_ID, CTX);

    expect(sendOwnerEmailOnce).toHaveBeenCalledWith(
      makeOwnerAccessTarget(INVITED_TENANT),
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
    );
  });

  describe('when the invite cannot be sent', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectInvites).mockRejectedValue(
        new Error(SANITY_OUTAGE),
      );
    });

    it('retries before its last attempt', async () => {
      await expect(inviteOwner(TEST_TENANT_ID, CTX)).rejects.toThrow(
        SANITY_OUTAGE,
      );
    });

    it('logs and lets provisioning carry on once the last attempt fails', async () => {
      vi.mocked(getStepMetadata).mockReturnValue({
        attempt: 99,
      } as ReturnType<typeof getStepMetadata>);

      const result = await inviteOwner(TEST_TENANT_ID, CTX);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(logger.error).toHaveBeenCalledWith('owner_access.invite_failed', {
        tenantId: TEST_TENANT_ID,
        runId: CTX.runId,
        error: SANITY_OUTAGE,
      });
    });
  });
});
