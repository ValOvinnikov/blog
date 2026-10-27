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
import { faker } from '@faker-js/faker';
import {
  MOCK_INVITE_SENT_AT,
  MOCK_OWNER_EMAIL,
  mockPendingInvite,
  mockSanityOwner,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';

import { resendOwnerInvite } from './resend-owner-invite';

faker.seed(7010);

const MOCK_OLD_INVITE_ID = faker.string.uuid();
const MOCK_NEW_INVITE_ID = faker.string.uuid();
const MOCK_OTHER_INVITE_ID = faker.string.uuid();
const MOCK_OTHER_INVITEE_EMAIL = faker.internet.email();

vi.mock('@worker/utils/owner-email/send-owner-email');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');

describe(resendOwnerInvite, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites)
      .mockResolvedValueOnce([
        mockPendingInvite({ id: MOCK_OLD_INVITE_ID }),
        mockPendingInvite({
          id: MOCK_OTHER_INVITE_ID,
          email: MOCK_OTHER_INVITEE_EMAIL,
        }),
      ])
      .mockResolvedValueOnce([mockPendingInvite({ id: MOCK_NEW_INVITE_ID })]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue(okResult({} as never));
  });

  it("revokes the owner's previous invite and only theirs", async () => {
    await resendOwnerInvite(MOCK_TENANT_ID);

    expect(deleteSanityProjectInvite).toHaveBeenCalledOnce();
    expect(deleteSanityProjectInvite).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      inviteId: MOCK_OLD_INVITE_ID,
    });
  });

  it('sends a new viewer invite after the revoke', async () => {
    await resendOwnerInvite(MOCK_TENANT_ID);

    expect(createSanityProjectInvite).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      email: MOCK_OWNER_EMAIL,
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
    expect(
      vi.mocked(deleteSanityProjectInvite).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(createSanityProjectInvite).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('records the new invite and restarts its heads-up and nudge', async () => {
    await resendOwnerInvite(MOCK_TENANT_ID);

    expect(setTenantOwnerAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      sanityInviteId: MOCK_NEW_INVITE_ID,
      inviteSentAt: new Date(MOCK_INVITE_SENT_AT),
      inviteAcceptedAt: null,
      inviteHeadsUpSentAt: null,
      inviteNudgeSentAt: null,
    });
  });

  it('claims a new heads-up once the new invite is recorded', async () => {
    await resendOwnerInvite(MOCK_TENANT_ID);

    expect(sendOwnerEmailOnce).toHaveBeenCalledOnce();
    const [target, kind] = vi.mocked(sendOwnerEmailOnce).mock.lastCall ?? [];
    expect(target?.ownerEmail).toBe(MOCK_OWNER_EMAIL);
    expect(kind).toBe(TENANT_OWNER_EMAIL.INVITE_HEADS_UP);
    expect(
      vi.mocked(setTenantOwnerAccess).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(sendOwnerEmailOnce).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('sends no invite when the owner is already a project member', async () => {
    vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityOwner()]);

    await resendOwnerInvite(MOCK_TENANT_ID);

    expect(deleteSanityProjectInvite).not.toHaveBeenCalled();
    expect(createSanityProjectInvite).not.toHaveBeenCalled();
  });
});
