import type { TValueOf } from '@blog/config/utils';

export const PROVISIONING_UNIT_MAX_RETRIES = 3;
export const PROVISIONING_AUDIT_ACTOR_ID = 'worker';
export const PROVISIONING_AUDIT_ACTOR_EMAIL = 'worker@system.invalid';
export const PROVISIONING_AUDIT_VIA = 'provision-tenant-worker';

export const PROVISION_CLI_RESULT = {
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  ALREADY_IN_PROGRESS: 'ALREADY_IN_PROGRESS',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type TProvisionCliResult = TValueOf<typeof PROVISION_CLI_RESULT>;
export const UNKNOWN_RUN_ERROR = 'unknown error';
export const PROVISIONING_BEGIN_FAILED_EVENT = 'provisioning.begin_failed';
