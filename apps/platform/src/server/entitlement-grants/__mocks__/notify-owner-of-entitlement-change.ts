import type {
  notifyOwnerOfEntitlementGrant as TNotifyOwnerOfEntitlementGrant,
  notifyOwnerOfEntitlementRevoke as TNotifyOwnerOfEntitlementRevoke,
} from '@platform/server/entitlement-grants/notify-owner-of-entitlement-change';

export const notifyOwnerOfEntitlementGrant =
  vi.fn<typeof TNotifyOwnerOfEntitlementGrant>();
export const notifyOwnerOfEntitlementRevoke =
  vi.fn<typeof TNotifyOwnerOfEntitlementRevoke>();
