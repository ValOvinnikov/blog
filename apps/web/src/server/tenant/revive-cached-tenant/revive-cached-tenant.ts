import type { TMaybeJsonDates } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { toMaybeDate } from '@web/utils/to-maybe-date';

const toDate = (value: Date | string): Date => new Date(value);

export const reviveCachedTenant = (
  tenant: TMaybeJsonDates<TTenant>,
): TTenant => ({
  ...tenant,
  seededAt: toMaybeDate(tenant.seededAt),
  webhookCreatedAt: toMaybeDate(tenant.webhookCreatedAt),
  deprovisionedAt: toMaybeDate(tenant.deprovisionedAt),
  ownerInviteSentAt: toMaybeDate(tenant.ownerInviteSentAt),
  ownerInviteAcceptedAt: toMaybeDate(tenant.ownerInviteAcceptedAt),
  ownerInviteHeadsUpSentAt: toMaybeDate(tenant.ownerInviteHeadsUpSentAt),
  ownerInviteNudgeSentAt: toMaybeDate(tenant.ownerInviteNudgeSentAt),
  ownerSiteReadySentAt: toMaybeDate(tenant.ownerSiteReadySentAt),
  lastActivityAt: toDate(tenant.lastActivityAt),
  inactivityWarnedAt: toMaybeDate(tenant.inactivityWarnedAt),
  suspendedAt: toMaybeDate(tenant.suspendedAt),
  deletionNotifiedAt: toMaybeDate(tenant.deletionNotifiedAt),
  contentMigrationFailedAt: toMaybeDate(tenant.contentMigrationFailedAt),
  firstPostPublishedAt: toMaybeDate(tenant.firstPostPublishedAt),
  trialEndsAt: toMaybeDate(tenant.trialEndsAt),
  downgradeGraceStartedAt: toMaybeDate(tenant.downgradeGraceStartedAt),
  graceStartedEmailSentAt: toMaybeDate(tenant.graceStartedEmailSentAt),
  graceHalfwayEmailSentAt: toMaybeDate(tenant.graceHalfwayEmailSentAt),
  graceEndingEmailSentAt: toMaybeDate(tenant.graceEndingEmailSentAt),
  createdAt: toDate(tenant.createdAt),
  updatedAt: toDate(tenant.updatedAt),
});
