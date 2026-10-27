import type { TMaybeJsonDates, TMaybeNull } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';

const toDate = (value: Date | string): Date => new Date(value);

const toMaybeDate = (value: TMaybeNull<Date | string>): TMaybeNull<Date> =>
  value === null ? null : new Date(value);

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
  createdAt: toDate(tenant.createdAt),
  updatedAt: toDate(tenant.updatedAt),
});
