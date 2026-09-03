import type { TValueOf } from '@blog/config/utils';

export const AUDIT_TARGET_TYPE = {
  TENANT: 'TENANT',
  SITE_CONFIG: 'SITE_CONFIG',
  SETTINGS_FEATURES: 'SETTINGS_FEATURES',
} as const;

export type TAuditTargetType = TValueOf<typeof AUDIT_TARGET_TYPE>;

// Bare verbs, not dot-namespaced with the entity (e.g. not `TENANT_ARCHIVED`)
// — the `targetType` column already carries which entity a row is about, so
// the action stays reusable across target types instead of being repeated
// once per entity it could ever apply to.
//
// A lifecycle run spanning two systems gets one action per system, reading
// request-then-outcome: `DEPROVISION_REQUESTED` is the platform app
// dispatching the workflow, `DEPROVISIONED` is the CLI reporting the archive
// happened — as `CREATED` precedes the CLI's `PROVISIONED`/
// `PROVISIONING_FAILED`. No action may reuse a `TENANT_STATUS` value, or a
// row's resting state and the event that produced it share a word.
export const AUDIT_ACTION = {
  CREATED: 'CREATED',
  DEPROVISION_REQUESTED: 'DEPROVISION_REQUESTED',
  DEPROVISIONED: 'DEPROVISIONED',
  PROVISIONED: 'PROVISIONED',
  PROVISIONING_FAILED: 'PROVISIONING_FAILED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  DELETED: 'DELETED',
} as const;

export type TAuditAction = TValueOf<typeof AUDIT_ACTION>;
