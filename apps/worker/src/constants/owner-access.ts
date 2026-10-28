export const OWNER_ACCESS_FAST_POLL_TICKS = 30;
export const OWNER_ACCESS_FAST_POLL_INTERVAL = '1m';
export const OWNER_ACCESS_SLOW_POLL_INTERVAL = '1h';
export const OWNER_ACCESS_HOOK_TOKEN_PREFIX = 'owner-access:';
export const SANITY_PENDING_INVITE_STATUS = 'pending';
export const OWNER_ACCESS_FINDING_AFTER_MS = 30 * 60_000;
export const OWNER_ACCESS_FINDING_IDENTIFIER = 'owner-access';
export const OWNER_ACCESS_LOG = {
  CHECK_FAILED: 'owner_access.check_failed',
  ACTIVITY_TOUCH_FAILED: 'owner_access.activity_touch_failed',
  FINDING_OPEN_FAILED: 'owner_access.finding_open_failed',
  FINDING_RESOLVE_FAILED: 'owner_access.finding_resolve_failed',
} as const;
