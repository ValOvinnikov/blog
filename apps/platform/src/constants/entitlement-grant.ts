import type { TValueOf } from '@shinefold/config/utils';

export const ENTITLEMENT_GRANT_NOTE_MAX_LENGTH = 500;

export const ENTITLEMENT_GRANT_FIELD_ERROR = {
  EXPIRY_NOT_FUTURE: 'EXPIRY_NOT_FUTURE',
} as const;

export type TEntitlementGrantFieldError = TValueOf<
  typeof ENTITLEMENT_GRANT_FIELD_ERROR
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
