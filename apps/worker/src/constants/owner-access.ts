export const OWNER_ACCESS_RUN_CHECKS = 30;
export const OWNER_ACCESS_SWEEP_CHECKS = 1;
export const OWNER_ACCESS_POLL_INTERVAL = '1m';
// A run makes at most OWNER_ACCESS_RUN_CHECKS one-minute checks, so one this old started on an earlier deployment.
export const OWNER_ACCESS_STALE_RUN_AFTER_MS = 45 * 60_000;
export const OWNER_ACCESS_STALE_RUN_CANCEL_REASON =
  'Replaced by an owner-access run on the current deployment.';
export const OWNER_ACCESS_HOOK_TOKEN_PREFIX = 'owner-access:';
export const SANITY_PENDING_INVITE_STATUS = 'pending';
export const OWNER_ACCESS_FINDING_AFTER_MS = 30 * 60_000;
export const OWNER_ACCESS_FINDING_IDENTIFIER = 'owner-access';
export const OWNER_ACCESS_LOG = {
  CHECK_FAILED: 'owner_access.check_failed',
  ACTIVITY_TOUCH_FAILED: 'owner_access.activity_touch_failed',
  FINDING_OPEN_FAILED: 'owner_access.finding_open_failed',
  FINDING_RESOLVE_FAILED: 'owner_access.finding_resolve_failed',
  SWEEP_NOT_CONFIGURED: 'owner_access.sweep_not_configured',
  SWEEP_FAILED: 'owner_access.sweep_failed',
  SWEEP_TENANT_FAILED: 'owner_access.sweep_tenant_failed',
} as const;
