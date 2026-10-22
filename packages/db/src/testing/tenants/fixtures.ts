import {
  LOCALE_ISO_CODES,
  SANITY_LOGIN_PROVIDER,
} from '@blog/config/constants';
import {
  SANITY_PROJECT_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenantOwnerAccess } from '@blog/db/queries/tenants/tenant-owner-access';
import type * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';

export const REVALIDATE_WEBHOOK_SECRET = 'whsec-tenant-secret-value';

export function makeTenantOwnerAccess(
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

export function makeTenant(overrides: Partial<TTenant> = {}): TTenant {
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
