import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { GET_STARTED_STEP } from '@platform/constants/get-started';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { getStartedFor } from './get-started-for';

faker.seed(7154);

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

const owner = mockMembership();
const MOCK_SAVED_AT = faker.date.recent();
const MOCK_SANITY_USER_ID = faker.string.uuid();

const justInvited = () =>
  mockReadyTenant({ ownerInviteSentAt: faker.date.recent() });

describe(getStartedFor, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(mockSiteConfig());
  });

  it('shows a just-provisioned owner their site and four steps not done', async () => {
    const getStarted = await getStartedFor(justInvited(), owner);

    expect(getStarted).toEqual({
      tenantId: MOCK_TENANT_ID,
      siteAddress: MOCK_TENANT_DOMAIN,
      doneSteps: {
        [GET_STARTED_STEP.LOOK]: false,
        [GET_STARTED_STEP.VOICE]: false,
        [GET_STARTED_STEP.EDITOR_INVITE]: false,
        [GET_STARTED_STEP.FIRST_POST]: false,
      },
      studioAccess: OWNER_STUDIO_ACCESS.INVITE_SENT,
    });
  });

  it('marks the invite done and the editor ready once the owner has joined', async () => {
    const tenant = mockReadyTenant({
      ownerInviteSentAt: MOCK_SAVED_AT,
      ownerInviteAcceptedAt: MOCK_SAVED_AT,
      ownerSanityUserId: MOCK_SANITY_USER_ID,
    });

    const getStarted = await getStartedFor(tenant, owner);

    expect(getStarted?.doneSteps[GET_STARTED_STEP.EDITOR_INVITE]).toBe(true);
    expect(getStarted?.studioAccess).toBe(OWNER_STUDIO_ACCESS.READY);
  });

  it('treats an owner the worker never invited as having the editor already', async () => {
    const getStarted = await getStartedFor(mockReadyTenant(), owner);

    expect(getStarted?.doneSteps[GET_STARTED_STEP.EDITOR_INVITE]).toBe(true);
    expect(getStarted?.studioAccess).toBe(OWNER_STUDIO_ACCESS.READY);
  });

  it('marks the first post done once one has been published', async () => {
    const tenant = mockReadyTenant({ firstPostPublishedAt: MOCK_SAVED_AT });

    const getStarted = await getStartedFor(tenant, owner);

    expect(getStarted?.doneSteps[GET_STARTED_STEP.FIRST_POST]).toBe(true);
  });

  describe('with Look and Voice saved', () => {
    beforeEach(() => {
      getSiteConfigMock.mockResolvedValue(
        mockSiteConfig({
          lookSavedAt: MOCK_SAVED_AT,
          voiceSavedAt: MOCK_SAVED_AT,
        }),
      );
    });

    it('marks Look and Voice done', async () => {
      const getStarted = await getStartedFor(justInvited(), owner);

      expect(getStarted?.doneSteps).toMatchObject({
        [GET_STARTED_STEP.LOOK]: true,
        [GET_STARTED_STEP.VOICE]: true,
      });
    });

    it('shows nothing once the first post is published too', async () => {
      const tenant = mockReadyTenant({ firstPostPublishedAt: MOCK_SAVED_AT });

      const getStarted = await getStartedFor(tenant, owner);

      expect(getStarted).toBeUndefined();
    });
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])('shows nothing while provisioning is %s', async (provisioningStatus) => {
    const tenant = mockReadyTenant({ provisioningStatus });

    const getStarted = await getStartedFor(tenant, owner);

    expect(getStarted).toBeUndefined();
  });

  it('shows nothing on an archived site', async () => {
    const tenant = mockReadyTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });

    const getStarted = await getStartedFor(tenant, owner);

    expect(getStarted).toBeUndefined();
  });

  it('shows nothing to a member who is not the owner', async () => {
    const editor = mockMembership({ role: MEMBERSHIP_ROLE.EDITOR });

    const getStarted = await getStartedFor(justInvited(), editor);

    expect(getStarted).toBeUndefined();
  });

  it('shows nothing to an operator viewing the site', async () => {
    const operator = buildVirtualAdminMembership(
      mockAdmin().userId,
      owner.tenantId,
    );

    const getStarted = await getStartedFor(justInvited(), operator);

    expect(getStarted).toBeUndefined();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });
});
