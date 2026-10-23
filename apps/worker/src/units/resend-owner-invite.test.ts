import { SANITY_PROJECT_ROLE } from '@blog/config/constants';
import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { getTenantById, setTenantOwnerAccess } from '@blog/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { okResult } from '@blog/utils/result';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import {
  makeSanityOwner,
  OWNER_EMAIL,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';

import { resendOwnerInvite } from './resend-owner-invite';

const OLD_INVITE_ID = 'invite-old';
const NEW_INVITE_ID = 'invite-new';
const SENT_AT = '2026-10-20T09:00:00.000Z';

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

describe(resendOwnerInvite, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ sanityProjectId: SANITY_PROJECT_ID }),
    );
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites)
      .mockResolvedValueOnce([
        {
          id: OLD_INVITE_ID,
          email: OWNER_EMAIL,
          status: SANITY_PENDING_INVITE_STATUS,
        },
        {
          id: 'invite-other',
          email: 'other@example.com',
          status: SANITY_PENDING_INVITE_STATUS,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: NEW_INVITE_ID,
          email: OWNER_EMAIL,
          status: SANITY_PENDING_INVITE_STATUS,
          createdAt: SENT_AT,
        },
      ]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue(okResult({} as never));
  });

  it("revokes the owner's previous invite and only theirs", async () => {
    await resendOwnerInvite(TEST_TENANT_ID);

    expect(deleteSanityProjectInvite).toHaveBeenCalledOnce();
    expect(deleteSanityProjectInvite).toHaveBeenCalledWith({
      token: getProvisionEnv().sanityManagementToken,
      projectId: SANITY_PROJECT_ID,
      inviteId: OLD_INVITE_ID,
    });
  });

  it('sends a new viewer invite after the revoke', async () => {
    await resendOwnerInvite(TEST_TENANT_ID);

    expect(createSanityProjectInvite).toHaveBeenCalledWith({
      token: getProvisionEnv().sanityManagementToken,
      projectId: SANITY_PROJECT_ID,
      email: OWNER_EMAIL,
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
    expect(
      vi.mocked(deleteSanityProjectInvite).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(createSanityProjectInvite).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('records the new invite and restarts its heads-up and nudge', async () => {
    await resendOwnerInvite(TEST_TENANT_ID);

    expect(setTenantOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, {
      sanityInviteId: NEW_INVITE_ID,
      inviteSentAt: new Date(SENT_AT),
      inviteAcceptedAt: null,
      inviteHeadsUpSentAt: null,
      inviteNudgeSentAt: null,
    });
  });

  it('claims a new heads-up once the new invite is recorded', async () => {
    await resendOwnerInvite(TEST_TENANT_ID);

    expect(sendOwnerEmailOnce).toHaveBeenCalledOnce();
    expect(sendOwnerEmailOnce).toHaveBeenCalledWith(
      expect.objectContaining({ ownerEmail: OWNER_EMAIL }),
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
    );
    expect(
      vi.mocked(setTenantOwnerAccess).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(sendOwnerEmailOnce).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('sends no invite when the owner is already a project member', async () => {
    vi.mocked(listSanityProjectUsers).mockResolvedValue([makeSanityOwner()]);

    await resendOwnerInvite(TEST_TENANT_ID);

    expect(deleteSanityProjectInvite).not.toHaveBeenCalled();
    expect(createSanityProjectInvite).not.toHaveBeenCalled();
  });
});
