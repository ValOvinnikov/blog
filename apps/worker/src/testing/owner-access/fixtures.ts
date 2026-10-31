import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
  SANITY_PROJECT_ROLE,
  SANITY_RESOURCE_TYPE,
  type TSanityResourceType,
} from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TFindingSummary } from '@blog/db/schema/findings';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_IDLE_PROVISIONING_STEPS } from '@blog/db/testing/tenants/fixtures';
import type { TSanityInvite } from '@blog/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import { createMockFaker } from '@worker/testing/mock-faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

const mockFaker = createMockFaker(6028);

export const MOCK_OWNER_EMAIL = 'owner@example.com';
export const MOCK_MIXED_CASE_OWNER_EMAIL = MOCK_OWNER_EMAIL.toUpperCase();
export const MOCK_INVITE_SENT_AT = '2026-10-20T09:00:00.000Z';
export const MOCK_SANITY_INVITE_ID = 'invite-1';
export const MOCK_OWNER_PROJECT_USER_ID = 'p-owner';
export const MOCK_SANITY_USER_ID = `g${mockFaker.string.alphanumeric(10)}`;
const MOCK_OWNER_PROFILE_ID = `p${mockFaker.string.alphanumeric(10)}`;
export const MOCK_OWNER_ACCESS_FINDING_ID = mockFaker.string.uuid();

export function mockSanityOwner(
  overrides: Partial<TSanityUser['profile']> = {},
): TSanityUser {
  return {
    sanityUserId: MOCK_SANITY_USER_ID,
    profile: {
      id: MOCK_OWNER_PROJECT_USER_ID,
      email: MOCK_OWNER_EMAIL,
      provider: 'google',
      ...overrides,
    },
  };
}

export function mockSanityOwnerWithMembership(
  profile: Partial<TSanityUser['profile']> = { id: MOCK_OWNER_PROFILE_ID },
  resourceUserId = MOCK_OWNER_PROJECT_USER_ID,
  resourceType: TSanityResourceType = SANITY_RESOURCE_TYPE.PROJECT,
): TSanityUser {
  return {
    ...mockSanityOwner(profile),
    memberships: [
      {
        resourceType,
        resourceId: MOCK_SANITY_PROJECT_ID,
        roleNames: [SANITY_PROJECT_ROLE.VIEWER],
        resourceUserId,
      },
    ],
  };
}

export function mockOwnerAccessTarget(tenant: TTenant): TOwnerAccessTarget {
  return {
    tenant,
    projectId: MOCK_SANITY_PROJECT_ID,
    ownerEmail: MOCK_OWNER_EMAIL,
    token: MOCK_TENANT_MANAGEMENT_TOKEN,
    env: MOCK_PROVISION_ENV,
  };
}

export function mockPendingInvite(
  overrides: Partial<TSanityInvite> = {},
): TSanityInvite {
  return {
    id: MOCK_SANITY_INVITE_ID,
    email: MOCK_OWNER_EMAIL,
    status: SANITY_PENDING_INVITE_STATUS,
    createdAt: MOCK_INVITE_SENT_AT,
    ...overrides,
  };
}

export function mockOwnerAccessFailingSince(
  failingSince: Date,
  overrides: Partial<TTenant> = {},
): TTenant {
  return mockProvisionedTenant({
    provisioningSteps: {
      ...MOCK_IDLE_PROVISIONING_STEPS,
      [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
        failingSince: failingSince.toISOString(),
      },
    },
    ...overrides,
  });
}

export function mockOwnerAccessFinding(): TFindingSummary {
  return {
    id: MOCK_OWNER_ACCESS_FINDING_ID,
    tenantId: MOCK_TENANT_ID,
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind: FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
    severity: FINDING_SEVERITY.WARNING,
    status: FINDING_STATUS.OPEN,
    dedupeKey: mockFaker.string.alphanumeric(12),
    hasDetails: true,
    firstSeenAt: new Date(MOCK_INVITE_SENT_AT),
    lastSeenAt: new Date(MOCK_INVITE_SENT_AT),
    resolvedAt: null,
  };
}
