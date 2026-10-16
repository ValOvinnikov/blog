import type { TValueOf } from '@blog/config/utils';

export const AUDIT_TARGET_TYPE = {
  TENANT: 'TENANT',
  SITE_CONFIG: 'SITE_CONFIG',
  SETTINGS_FEATURES: 'SETTINGS_FEATURES',
  RELEASE: 'RELEASE',
} as const;

export type TAuditTargetType = TValueOf<typeof AUDIT_TARGET_TYPE>;

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
  REACTIVATED: 'REACTIVATED',
  PROVISIONED: 'PROVISIONED',
  PROVISIONING_FAILED: 'PROVISIONING_FAILED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  DELETED: 'DELETED',
  READER_DATA_PURGED: 'READER_DATA_PURGED',
  RELEASE_STARTED: 'RELEASE_STARTED',
  RELEASE_OVERRIDE: 'RELEASE_OVERRIDE',
  CONTRAST_CHECK_STARTED: 'CONTRAST_CHECK_STARTED',
  TENANT_MIGRATIONS_STARTED: 'TENANT_MIGRATIONS_STARTED',
} as const;

export type TAuditAction = TValueOf<typeof AUDIT_ACTION>;
