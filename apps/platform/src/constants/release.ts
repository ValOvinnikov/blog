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

export const IS_PRODUCTION_RELEASE_ENABLED = false;

// The job name inside migrate-tenant-content.yml, which release.yml calls.
export const TENANT_MIGRATION_JOB_NAME = 'Migrate tenant content';

export const GITHUB_COMPARE_FILE_LIMIT = 300;

export const RELEASE_OVERRIDE_REASON_MAX_LENGTH = 500;

export const RELEASE_REFUSAL = {
  CONTRAST_CHECK_RUNNING: 'CONTRAST_CHECK_RUNNING',
  RELEASE_RUNNING: 'RELEASE_RUNNING',
  RELEASES_PAUSED: 'RELEASES_PAUSED',
} as const;

export const RELEASE_FIELD_ERROR = {
  VERSION_MALFORMED: 'VERSION_MALFORMED',
  VERSION_NOT_GREATER: 'VERSION_NOT_GREATER',
  REASON_REQUIRED: 'REASON_REQUIRED',
} as const;

export type TReleaseFieldError = TValueOf<typeof RELEASE_FIELD_ERROR>;

export const RELEASE_RUN_STATUS = {
  DISPATCHED: 'DISPATCHED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type TReleaseRunStatus = TValueOf<typeof RELEASE_RUN_STATUS>;
