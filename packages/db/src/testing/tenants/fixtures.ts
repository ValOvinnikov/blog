import {
  LOCALE_ISO_CODES,
  SANITY_LOGIN_PROVIDER,
} from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  SANITY_PROJECT_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenantOwnerAccess } from '@blog/db/queries/tenants/tenant-owner-access';
import type * as schema from '@blog/db/schema';
import type {
  TTenant,
  TTenantDeprovisioningState,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { faker } from '@faker-js/faker';

export const MOCK_REVALIDATE_WEBHOOK_SECRET = 'whsec-tenant-secret-value';
export const MOCK_TENANT_DOMAIN = faker.internet.domainName();
export const MOCK_MISSING_TENANT_ID = faker.string.uuid();
export const MOCK_TENANT_READ_TOKEN = 'sk-real-token-value';
export const MOCK_TENANT_WRITE_TOKEN = 'sk-real-write-token-value';
export const MOCK_DEPROVISIONED_AT = faker.date.past();
export const MOCK_SEEDED_AT = faker.date.past();
export const MOCK_UNKNOWN_SANITY_PROJECT_ID = faker.string.alphanumeric(8);
const RUN_AT = faker.date.recent();
const RUN_FINISHED_AT = faker.date.soon({ refDate: RUN_AT });
export const MOCK_RUN_AT = RUN_AT.toISOString();
export const MOCK_RUN_FINISHED_AT = RUN_FINISHED_AT.toISOString();
export const MOCK_RERUN_AT = faker.date
  .soon({ refDate: RUN_FINISHED_AT })
  .toISOString();

export const MOCK_TENANT_VALUES = {
  name: faker.company.name(),
  primaryDomain: MOCK_TENANT_DOMAIN,
  sanityProjectId: faker.string.alphanumeric(8),
  sanityDataset: faker.word.noun(),
  locale: LOCALE_ISO_CODES.EN,
  plan: TENANT_PLAN.FREE,
};

export function mockTenantOwnerAccess(
  overrides: Partial<TTenantOwnerAccess> = {},
): TTenantOwnerAccess {
  const inviteSentAt = faker.date.recent();

  return {
    sanityInviteId: faker.string.uuid(),
    inviteSentAt,
    inviteAcceptedAt: faker.date.soon({ refDate: inviteSentAt }),
    sanityUserId: faker.string.alphanumeric(10),
    loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    sanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    inviteHeadsUpSentAt: inviteSentAt,
    inviteNudgeSentAt: faker.date.soon({ refDate: inviteSentAt }),
    siteReadySentAt: faker.date.soon({ refDate: inviteSentAt }),
    ...overrides,
  };
}

export function toTenantOwnerAccessColumns(
  access: Partial<TTenantOwnerAccess>,
): Partial<typeof schema.tenants.$inferInsert> {
  return {
    ownerSanityInviteId: access.sanityInviteId,
    ownerInviteSentAt: access.inviteSentAt,
    ownerInviteAcceptedAt: access.inviteAcceptedAt,
    ownerSanityUserId: access.sanityUserId,
    ownerLoginProvider: access.loginProvider,
    ownerSanityRole: access.sanityRole,
    ownerInviteHeadsUpSentAt: access.inviteHeadsUpSentAt,
    ownerInviteNudgeSentAt: access.inviteNudgeSentAt,
    ownerSiteReadySentAt: access.siteReadySentAt,
  };
}

export function mockTenant(overrides: Partial<TTenant> = {}): TTenant {
  const createdAt = faker.date.past();

  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    primaryDomain: faker.internet.domainName(),
    sanityProjectId: faker.string.alphanumeric(8),
    sanityDataset: faker.word.noun(),
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    revalidateWebhookSecretEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    deprovisioningSteps: null,
    siteType: null,
    siteTemplateVersion: null,
    selfServeOwnerEmailIndex: null,
    ownerSanityInviteId: null,
    ownerInviteSentAt: null,
    ownerInviteAcceptedAt: null,
    ownerSanityUserId: null,
    ownerLoginProvider: null,
    ownerSanityRole: null,
    ownerInviteHeadsUpSentAt: null,
    ownerInviteNudgeSentAt: null,
    ownerSiteReadySentAt: null,
    lastActivityAt: createdAt,
    inactivityWarnedAt: null,
    suspendedAt: null,
    deletionNotifiedAt: null,
    suspensionReason: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export const MOCK_WORKFLOW_RUN_URL = faker.internet.url();
export const MOCK_PROVISIONING_REGISTRY = 'development';
export const MOCK_STEP_ERROR = 'Sanity Projects API returned 429';

const MOCK_IDLE_STEP = { status: TENANT_PROVISIONING_STEP_STATUS.IDLE };

export const MOCK_IDLE_PROVISIONING_STEPS: TTenantProvisioningState = {
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: MOCK_IDLE_STEP,
  [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: MOCK_IDLE_STEP,
};

export const MOCK_IDLE_DEPROVISIONING_STEPS: TTenantDeprovisioningState = {
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.ARCHIVE_TENANT]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.PURGE_READER_DATA]: MOCK_IDLE_STEP,
  [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: MOCK_IDLE_STEP,
};

export function unwrapOk<T, E>(result: TResult<T, E>): T {
  if (!result.ok) {
    throw new Error(`expected ok:true, got error "${String(result.error)}"`);
  }
  return result.data;
}
