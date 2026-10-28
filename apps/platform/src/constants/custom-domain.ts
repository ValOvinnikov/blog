import type { TValueOf } from '@blog/config/utils';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';

export const CUSTOM_DOMAIN_FIELD_ERROR = {
  DOMAIN_INVALID: TENANT_FIELD_ERROR.DOMAIN_INVALID,
  DOMAIN_PLATFORM_ADDRESS: 'DOMAIN_PLATFORM_ADDRESS',
  DOMAIN_TAKEN: TENANT_FIELD_ERROR.DOMAIN_TAKEN,
} as const;

export type TCustomDomainFieldError = TValueOf<
  typeof CUSTOM_DOMAIN_FIELD_ERROR
>;

export const CUSTOM_DOMAIN_REFUSAL = {
  NOT_FOUND: TENANT_REFUSAL.NOT_FOUND,
  ARCHIVED: TENANT_REFUSAL.ARCHIVED,
  NOT_ON_PLAN: 'NOT_ON_PLAN',
  NOT_PROVISIONED: 'NOT_PROVISIONED',
  ALREADY_CONNECTED: 'ALREADY_CONNECTED',
  NOT_CUSTOM_DOMAIN: 'NOT_CUSTOM_DOMAIN',
  CLAIM_PENDING: 'CLAIM_PENDING',
  NO_PENDING_CLAIM: 'NO_PENDING_CLAIM',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  CONNECT_UNAVAILABLE: 'CONNECT_UNAVAILABLE',
  CONNECT_CONFLICT: 'CONNECT_CONFLICT',
} as const;

export type TCustomDomainRefusal = TValueOf<typeof CUSTOM_DOMAIN_REFUSAL>;

export const CUSTOM_DOMAIN_CONNECT_REJECTIONS: readonly TCustomDomainRefusal[] =
  [
    CUSTOM_DOMAIN_REFUSAL.CONNECT_UNAVAILABLE,
    CUSTOM_DOMAIN_REFUSAL.CONNECT_CONFLICT,
  ];

export const CUSTOM_DOMAIN_VERIFY_POLL = {
  intervalMs: 15000,
  maxTicks: 40,
} as const;

export const CUSTOM_DOMAIN_TXT_LABEL = '_blog-verify';

export const CUSTOM_DOMAIN_TXT_TYPE = 'TXT';

export const CUSTOM_DOMAIN_PATH = {
  CONNECT: '/api/custom-domain/connect',
  DISCONNECT: '/api/custom-domain/disconnect',
} as const;

export const CUSTOM_DOMAIN_LOG = {
  CONNECT_ENQUEUE_REJECTED: 'custom_domain.connect_enqueue_rejected',
  CLAIM_RESTORE_FAILED: 'custom_domain.claim_restore_failed',
  CONNECT_FAILED: 'custom_domain.connect_failed',
  CONNECT_ROLLBACK_FAILED: 'custom_domain.connect_rollback_failed',
  VERIFY_AUDIT_FAILED: 'custom_domain.verify_audit_failed',
  VERIFY_FAILED: 'custom_domain.verify_failed',
  VERIFY_LOOKUP_FAILED: 'custom_domain.verify_lookup_failed',
  ROOT_DOMAIN_MISSING: 'custom_domain.root_domain_missing',
  APP_URL_MISSING: 'custom_domain.app_url_missing',
  DISCONNECT_AUDIT_FAILED: 'custom_domain.disconnect_audit_failed',
  DISCONNECT_REJECTED_RESTORING: 'custom_domain.disconnect_rejected_restoring',
  DISCONNECT_RESTORE_FAILED: 'custom_domain.disconnect_restore_failed',
  DISCONNECT_FAILED: 'custom_domain.disconnect_failed',
} as const;
