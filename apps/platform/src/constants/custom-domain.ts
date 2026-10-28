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
} as const;

export type TCustomDomainRefusal = TValueOf<typeof CUSTOM_DOMAIN_REFUSAL>;

export const CUSTOM_DOMAIN_PATH = {
  CONNECT: '/api/custom-domain/connect',
  DISCONNECT: '/api/custom-domain/disconnect',
} as const;

export const CUSTOM_DOMAIN_LOG = {
  CONNECT_AUDIT_FAILED: 'custom_domain.connect_audit_failed',
  CONNECT_ENQUEUE_REJECTED: 'custom_domain.connect_enqueue_rejected',
  CONNECT_FAILED: 'custom_domain.connect_failed',
  CONNECT_ROLLBACK_FAILED: 'custom_domain.connect_rollback_failed',
  ROOT_DOMAIN_MISSING: 'custom_domain.root_domain_missing',
  DISCONNECT_AUDIT_FAILED: 'custom_domain.disconnect_audit_failed',
  DISCONNECT_ENQUEUE_REJECTED: 'custom_domain.disconnect_enqueue_rejected',
  DISCONNECT_FAILED: 'custom_domain.disconnect_failed',
} as const;

export const CUSTOM_DOMAIN_CARD = { ID: 'custom-domain-card' } as const;
