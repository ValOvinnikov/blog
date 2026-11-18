import type { TValueOf } from '@shinefold/config/utils';

export const ENTITLEMENT_GRANT_NOTE_MAX_LENGTH = 500;

export const ENTITLEMENT_GRANT_EXPIRY = {
  NEVER: 'NEVER',
  DAYS_30: 'DAYS_30',
  DAYS_90: 'DAYS_90',
  YEAR_1: 'YEAR_1',
} as const;

export type TEntitlementGrantExpiry = TValueOf<typeof ENTITLEMENT_GRANT_EXPIRY>;

export const ENTITLEMENT_GRANT_EXPIRY_DAYS = {
  [ENTITLEMENT_GRANT_EXPIRY.DAYS_30]: 30,
  [ENTITLEMENT_GRANT_EXPIRY.DAYS_90]: 90,
  [ENTITLEMENT_GRANT_EXPIRY.YEAR_1]: 365,
} as const satisfies Record<
  Exclude<TEntitlementGrantExpiry, typeof ENTITLEMENT_GRANT_EXPIRY.NEVER>,
  number
>;

export const ENTITLEMENT_GRANT_REFUSAL = {
  COMING_SOON: 'COMING_SOON',
  ALREADY_GRANTED: 'ALREADY_GRANTED',
  GRANT_NOT_OPEN: 'GRANT_NOT_OPEN',
} as const;

export type TEntitlementGrantRefusal = TValueOf<
  typeof ENTITLEMENT_GRANT_REFUSAL
>;

export const ENTITLEMENT_GRANT_LOG = {
  GRANT_FAILED: 'entitlement_grants.grant_failed',
  GRANT_AUDIT_FAILED: 'entitlement_grants.grant_audit_failed',
  REVOKE_FAILED: 'entitlement_grants.revoke_failed',
  REVOKE_AUDIT_FAILED: 'entitlement_grants.revoke_audit_failed',
} as const;
