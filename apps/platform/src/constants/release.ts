import type { TValueOf } from '@blog/config/utils';

export const CONTRAST_STATUS = {
  GREEN: 'GREEN',
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  NONE: 'NONE',
  DUE: 'DUE',
} as const;

export type TContrastStatus = TValueOf<typeof CONTRAST_STATUS>;

export const CONTRAST_WORKFLOW_FILE = 'contrast.yml';

export const RELEASE_WORKFLOW_FILE = 'release.yml';

export const TENANT_MIGRATION_WORKFLOW_FILE = 'migrate-tenant-content.yml';

// The GitHub Environment names migrate-tenant-content.yml takes as its `environment` input.
export const MIGRATION_ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const;

export type TMigrationEnvironment = TValueOf<typeof MIGRATION_ENVIRONMENT>;

export const IS_PRODUCTION_RELEASE_ENABLED = false;

// The job name inside migrate-tenant-content.yml, which release.yml calls.
export const TENANT_MIGRATION_JOB_NAME = 'Migrate tenant content';

export const GITHUB_COMPARE_FILE_LIMIT = 300;

export const RELEASE_OVERRIDE_REASON_MAX_LENGTH = 500;

export const RELEASE_REFUSAL = {
  CONTRAST_CHECK_RUNNING: 'CONTRAST_CHECK_RUNNING',
  RELEASE_RUNNING: 'RELEASE_RUNNING',
  RELEASES_PAUSED: 'RELEASES_PAUSED',
  TENANT_REQUIRED: 'TENANT_REQUIRED',
  TENANT_MIGRATION_NOT_FAILED: 'TENANT_MIGRATION_NOT_FAILED',
} as const;

export const RELEASE_FIELD_ERROR = {
  VERSION_MALFORMED: 'VERSION_MALFORMED',
  VERSION_NOT_GREATER: 'VERSION_NOT_GREATER',
  REASON_REQUIRED: 'REASON_REQUIRED',
} as const;

export type TReleaseFieldError = TValueOf<typeof RELEASE_FIELD_ERROR>;

export const RELEASE_FAILURE = {
  NO_RELEASE_TAG: 'NO_RELEASE_TAG',
  TAG_LIST_INCOMPLETE: 'TAG_LIST_INCOMPLETE',
  DB_ERROR: 'DB_ERROR',
} as const;

export const RELEASE_RUN_STATUS = {
  DISPATCHED: 'DISPATCHED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type TReleaseRunStatus = TValueOf<typeof RELEASE_RUN_STATUS>;

export const RELEASE_LOG = {
  CONTRAST_CHECK_AUDIT_FAILED: 'releases.contrast_check_audit_failed',
  CONTRAST_DISPATCH_ERROR: 'releases.contrast_dispatch_error',
  CONTRAST_DISPATCH_FAILED: 'releases.contrast_dispatch_failed',
  CONTRAST_DISPATCH_SKIPPED: 'releases.contrast_dispatch_skipped',
  DB_READ_FAILED: 'releases.db_read_failed',
  RELEASE_AUDIT_FAILED: 'releases.release_audit_failed',
  RELEASE_DISPATCH_ERROR: 'releases.release_dispatch_error',
  RELEASE_DISPATCH_FAILED: 'releases.release_dispatch_failed',
  RELEASE_DISPATCH_SKIPPED: 'releases.release_dispatch_skipped',
  RELEASE_OVERRIDE_AUDIT_FAILED: 'releases.release_override_audit_failed',
  TENANT_MIGRATIONS_AUDIT_FAILED: 'releases.tenant_migrations_audit_failed',
  TENANT_MIGRATIONS_DISPATCH_ERROR: 'releases.tenant_migrations_dispatch_error',
  TENANT_MIGRATIONS_DISPATCH_FAILED:
    'releases.tenant_migrations_dispatch_failed',
  TENANT_MIGRATIONS_DISPATCH_SKIPPED:
    'releases.tenant_migrations_dispatch_skipped',
} as const;
