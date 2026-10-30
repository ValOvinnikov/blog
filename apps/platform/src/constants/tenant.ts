import type { TValueOf } from '@blog/config/utils';

export const TENANT_FIELD_ERROR = {
  CONFIRM_REQUIRED: 'CONFIRM_REQUIRED',
  NAME_MISMATCH: 'NAME_MISMATCH',
  NAME_REQUIRED: 'NAME_REQUIRED',
  DOMAIN_INVALID: 'DOMAIN_INVALID',
  DOMAIN_TAKEN: 'DOMAIN_TAKEN',
  DOMAIN_ATTACHED_ELSEWHERE: 'DOMAIN_ATTACHED_ELSEWHERE',
  DOMAIN_LOCKED: 'DOMAIN_LOCKED',
  DOMAIN_CUSTOM_MAIN: 'DOMAIN_CUSTOM_MAIN',
  SLUG_REQUIRED: 'SLUG_REQUIRED',
  SLUG_INVALID: 'SLUG_INVALID',
  SLUG_RESERVED: 'SLUG_RESERVED',
  SLUG_TAKEN: 'SLUG_TAKEN',
  EMAIL_INVALID: 'EMAIL_INVALID',
  LOCALE_UNSUPPORTED: 'LOCALE_UNSUPPORTED',
  PLAN_UNSUPPORTED: 'PLAN_UNSUPPORTED',
  OWNER_EMAIL_TAKEN: 'OWNER_EMAIL_TAKEN',
} as const;

export type TTenantFieldErrorReason = TValueOf<typeof TENANT_FIELD_ERROR>;

export const TENANT_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
  ARCHIVED: 'ARCHIVED',
  ALREADY_DEPROVISIONED: 'ALREADY_DEPROVISIONED',
  NOT_DEPROVISIONED: 'NOT_DEPROVISIONED',
  ALREADY_IN_PROGRESS: 'ALREADY_IN_PROGRESS',
  NOT_ARCHIVED: 'NOT_ARCHIVED',
  PLATFORM_TENANT: 'PLATFORM_TENANT',
  LOCALE_IS_ADDITIONAL: 'LOCALE_IS_ADDITIONAL',
  PROVISIONING_STARTED: 'PROVISIONING_STARTED',
  OWNER_ALREADY_JOINED: 'OWNER_ALREADY_JOINED',
  OWNER_HAS_FREE_TENANT: 'OWNER_HAS_FREE_TENANT',
  OWNER_INVITE_UNCONFIRMED: 'OWNER_INVITE_UNCONFIRMED',
  OWNER_EMAIL_UNKNOWN: 'OWNER_EMAIL_UNKNOWN',
  STUDIO_NOT_PROVISIONED: 'STUDIO_NOT_PROVISIONED',
} as const;

export type TTenantRefusal = TValueOf<typeof TENANT_REFUSAL>;

export const TENANT_FIELD_LOCK_KIND = {
  STEP: 'STEP',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  ARCHIVED: 'ARCHIVED',
  CUSTOM_MAIN_DOMAIN: 'CUSTOM_MAIN_DOMAIN',
} as const;

export const TENANT_LOG = {
  CREATE_AUDIT_FAILED: 'tenants.create_audit_failed',
  CREATE_DRAFT_FAILED: 'tenants.create_draft_failed',
  DELETE_AUDIT_FAILED: 'tenants.delete_audit_failed',
  DELETE_FAILED: 'tenants.delete_failed',
  DOMAIN_AVAILABILITY_APEX_UNDETERMINED:
    'tenants.domain_availability_apex_undetermined',
  DOMAIN_AVAILABILITY_CHECK_ERROR: 'tenants.domain_availability_check_error',
  DOMAIN_AVAILABILITY_CHECK_FAILED: 'tenants.domain_availability_check_failed',
  DOMAIN_AVAILABILITY_CHECK_PAGINATION_EXHAUSTED:
    'tenants.domain_availability_check_pagination_exhausted',
  DOMAIN_AVAILABILITY_INVALID_DOMAIN:
    'tenants.domain_availability_invalid_domain',
  OWNER_INVITE_EMAIL_FAILED: 'tenants.owner_invite_email_failed',
  PLATFORM_TENANT_REFUSED: 'tenants.platform_tenant_refused',
  ROOT_DOMAIN_MISSING: 'tenants.root_domain_missing',
  SIGN_IN_ACTIVITY_FAILED: 'tenant.sign_in_activity_failed',
  SIGN_IN_OWNER_LOOKUP_FAILED: 'tenant.sign_in_owner_lookup_failed',
  SUSPENSION_AUDIT_FAILED: 'tenant.suspension_audit_failed',
  SUSPENSION_BLOCK_FAILED: 'tenant.suspension_block_failed',
  SUSPENSION_BLOCK_UNDO_FAILED: 'tenant.suspension_block_undo_failed',
  SUSPENSION_SAVE_FAILED: 'tenant.suspension_save_failed',
  UPDATE_DETAILS_AUDIT_FAILED: 'tenants.update_details_audit_failed',
  UPDATE_DETAILS_FAILED: 'tenants.update_details_failed',
  UPDATE_LANGUAGES_AUDIT_FAILED: 'tenants.update_languages_audit_failed',
  UPDATE_LANGUAGES_FAILED: 'tenants.update_languages_failed',
  UPDATE_LANGUAGES_REJECTED: 'tenants.update_languages_rejected',
} as const;

export const TENANT_VISIBILITY = {
  ACTIVE: 'ACTIVE',
  ALL: 'ALL',
} as const;

export type TTenantVisibility = TValueOf<typeof TENANT_VISIBILITY>;
