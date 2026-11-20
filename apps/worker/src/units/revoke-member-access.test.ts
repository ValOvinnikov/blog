import { SANITY_PROJECT_ROLE } from '@shinefold/config/constants';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import {
  deleteSanityProjectInvite,
  listSanityProjectAcl,
  listSanityProjectInvites,
  revokeSanityProjectRole,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import { listSanityProjectUsers } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_INVITE_ID,
  MOCK_MEMBER_PROJECT_USER_ID,
  MOCK_MEMBER_SANITY_USER_ID,
  mockMemberAclEntry,
  mockSanityMember,
} from '@worker/testing/member-access/fixtures';
import {
  MOCK_OWNER_EMAIL,
  MOCK_OWNER_PROJECT_USER_ID,
  MOCK_SANITY_USER_ID,
  mockPendingInvite,
  mockSanityOwner,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_PROJECT_CALL,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';

import { revokeMemberAccess } from './revoke-member-access';

const MOCK_RENAMED_MEMBER_EMAIL = `renamed.${MOCK_MEMBER_EMAIL}`;

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');
vi.mock('workflow');

describe(revokeMemberAccess, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({ ownerSanityUserId: MOCK_SANITY_USER_ID }),
    );
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([]);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([
      mockSanityOwner(),
      mockSanityMember(),
    ]);
    vi.mocked(listSanityProjectAcl).mockResolvedValue([
      {
        projectUserId: MOCK_OWNER_PROJECT_USER_ID,
        roles: [{ name: SANITY_PROJECT_ROLE.ADMINISTRATOR }],
        isRobot: false,
      },
      mockMemberAclEntry(SANITY_PROJECT_ROLE.ADMINISTRATOR),
    ]);
  });

  it('revokes every role the removed member holds', async () => {
    await revokeMemberAccess(MOCK_TENANT_ID, { email: MOCK_MEMBER_EMAIL });

    expect(vi.mocked(revokeSanityProjectRole).mock.calls).toEqual([
      [
        {
          token: MOCK_PROVISION_ENV.sanityManagementToken,
          projectId: MOCK_SANITY_PROJECT_ID,
          projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
          roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
        },
      ],
    ]);
  });

  it('deletes their pending invite', async () => {
    vi.mocked(listSanityProjectInvites).mockResolvedValue([
      mockPendingInvite(),
      mockPendingInvite({
        id: MOCK_MEMBER_INVITE_ID,
        email: MOCK_MEMBER_EMAIL,
      }),
    ]);

    await revokeMemberAccess(MOCK_TENANT_ID, { email: MOCK_MEMBER_EMAIL });

    expect(vi.mocked(deleteSanityProjectInvite).mock.calls).toEqual([
      [{ ...MOCK_TENANT_PROJECT_CALL, inviteId: MOCK_MEMBER_INVITE_ID }],
    ]);
  });

  it('finds a member whose Sanity address differs by their Sanity user id', async () => {
    await revokeMemberAccess(MOCK_TENANT_ID, {
      email: MOCK_RENAMED_MEMBER_EMAIL,
      sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
    });

    expect(revokeSanityProjectRole).toHaveBeenCalledWith(
      expect.objectContaining({ projectUserId: MOCK_MEMBER_PROJECT_USER_ID }),
    );
  });

  it('revokes by Sanity user id alone, deleting no invite, when handed no address', async () => {
    await revokeMemberAccess(MOCK_TENANT_ID, {
      sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
    });

    expect(listSanityProjectInvites).not.toHaveBeenCalled();
    expect(revokeSanityProjectRole).toHaveBeenCalledWith(
      expect.objectContaining({ projectUserId: MOCK_MEMBER_PROJECT_USER_ID }),
    );
  });

  it('never revokes the owner, even when handed their Sanity user id', async () => {
    await revokeMemberAccess(MOCK_TENANT_ID, {
      email: MOCK_RENAMED_MEMBER_EMAIL,
      sanityUserId: MOCK_SANITY_USER_ID,
    });

    expect(revokeSanityProjectRole).not.toHaveBeenCalled();
  });

  it("changes nothing when handed the owner's address", async () => {
    await revokeMemberAccess(MOCK_TENANT_ID, { email: MOCK_OWNER_EMAIL });

    expect(listSanityProjectUsers).not.toHaveBeenCalled();
    expect(revokeSanityProjectRole).not.toHaveBeenCalled();
  });

  it('changes nothing for a tenant without a Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());

    await revokeMemberAccess(MOCK_TENANT_ID, { email: MOCK_MEMBER_EMAIL });

    expect(listSanityProjectUsers).not.toHaveBeenCalled();
  });

  it('changes nothing when run again after the member is gone', async () => {
    vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityOwner()]);

    await revokeMemberAccess(MOCK_TENANT_ID, { email: MOCK_MEMBER_EMAIL });

    expect(revokeSanityProjectRole).not.toHaveBeenCalled();
    expect(deleteSanityProjectInvite).not.toHaveBeenCalled();
  });
});
