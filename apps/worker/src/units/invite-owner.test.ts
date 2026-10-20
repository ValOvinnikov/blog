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
import {
  OWNER_EMAIL,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { getStepMetadata } from 'workflow';

import { inviteOwner } from './invite-owner';

const CTX = { runId: 'run-1' };
const PENDING_INVITE = {
  id: 'invite-1',
  email: OWNER_EMAIL,
  status: 'pending',
  createdAt: '2026-10-20T09:00:00.000Z',
};

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@blog/db/queries/tenants', async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(
    await importOriginal<typeof import('@blog/db/queries/tenants')>(),
  ),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

describe(inviteOwner, () => {
  beforeEach(() => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 1,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ sanityProjectId: SANITY_PROJECT_ID }),
    );
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([PENDING_INVITE]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue({
      ok: true,
      data: {} as never,
    });
  });

  it("records the owner's pending invite without sending a second one", async () => {
    const result = await inviteOwner(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
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

  it('retries a failed invite before its last attempt', async () => {
    vi.mocked(listSanityProjectInvites).mockRejectedValue(new Error('503'));

    await expect(inviteOwner(TEST_TENANT_ID, CTX)).rejects.toThrow('503');
  });

  it('logs and lets provisioning carry on once the last attempt fails', async () => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 99,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(listSanityProjectInvites).mockRejectedValue(new Error('503'));

    const result = await inviteOwner(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
    expect(logger.error).toHaveBeenCalledWith(
      'owner_access.invite_failed',
      expect.objectContaining({ tenantId: TEST_TENANT_ID }),
    );
  });
});
