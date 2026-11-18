import { SANITY_PROJECT_ROLE } from '@shinefold/config/constants';
import {
  getMemberStudioAccess,
  getTenantOwnerEmail,
  setMemberStudioAccess,
} from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { okResult } from '@shinefold/utils/result';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_INVITE_ID,
  MOCK_MEMBERSHIP_ID,
  mockMemberTarget,
  mockSanityMember,
} from '@worker/testing/member-access/fixtures';
import {
  MOCK_OWNER_EMAIL,
  mockPendingInvite,
} from '@worker/testing/owner-access/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_PROJECT_CALL,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';

import { resendMemberInvite } from './resend-member-invite';

const MOCK_STALE_INVITE = mockPendingInvite({
  id: MOCK_MEMBER_INVITE_ID,
  email: MOCK_MEMBER_EMAIL,
});

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');
vi.mock('workflow');

describe(resendMemberInvite, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(getMemberStudioAccess).mockResolvedValue(mockMemberTarget());
    vi.mocked(setMemberStudioAccess).mockResolvedValue(okResult({} as never));
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([MOCK_STALE_INVITE]);
  });

  it('replaces the pending invite with a fresh one', async () => {
    await resendMemberInvite(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

    expect(deleteSanityProjectInvite).toHaveBeenCalledWith({
      ...MOCK_TENANT_PROJECT_CALL,
      inviteId: MOCK_MEMBER_INVITE_ID,
    });
    expect(createSanityProjectInvite).toHaveBeenCalledWith({
      ...MOCK_TENANT_PROJECT_CALL,
      email: MOCK_MEMBER_EMAIL,
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
  });

  it('sends nothing to a member who has already joined the project', async () => {
    vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityMember()]);

    await resendMemberInvite(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

    expect(createSanityProjectInvite).not.toHaveBeenCalled();
  });

  it('sends nothing for a membership that is gone', async () => {
    vi.mocked(getMemberStudioAccess).mockResolvedValue(undefined);

    await resendMemberInvite(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

    expect(listSanityProjectUsers).not.toHaveBeenCalled();
    expect(createSanityProjectInvite).not.toHaveBeenCalled();
  });
});
