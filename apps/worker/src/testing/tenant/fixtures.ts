import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

export const TEST_TENANT_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';

export function makeTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: TEST_TENANT_ID,
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: null,
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
    lastActivityAt: new Date(0),
    inactivityWarnedAt: null,
    suspendedAt: null,
    deletionNotifiedAt: null,
    suspensionReason: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}
