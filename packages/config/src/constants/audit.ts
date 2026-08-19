import type { TValueOf } from '@blog/config/utils';

export const AUDIT_TARGET_TYPE = {
  TENANT: 'TENANT',
  TENANT_DOMAIN: 'TENANT_DOMAIN',
  SITE_CONFIG: 'SITE_CONFIG',
} as const;

export type TAuditTargetType = TValueOf<typeof AUDIT_TARGET_TYPE>;

// Bare verbs, not dot-namespaced with the entity (e.g. not `TENANT_ARCHIVED`)
// — the `targetType` column already carries which entity a row is about, so
// the action stays reusable across target types instead of being repeated
// once per entity it could ever apply to.
export const AUDIT_ACTION = {
  CREATED: 'CREATED',
  ARCHIVED: 'ARCHIVED',
  DEPROVISIONED: 'DEPROVISIONED',
  DOMAIN_CHANGED: 'DOMAIN_CHANGED',
  PLAN_CHANGED: 'PLAN_CHANGED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;

export type TAuditAction = TValueOf<typeof AUDIT_ACTION>;
