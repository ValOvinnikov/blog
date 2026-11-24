export const OWNER_ACCESS_RUN_CHECKS = 30;
export const OWNER_ACCESS_SWEEP_CHECKS = 1;
export const OWNER_ACCESS_POLL_INTERVAL_MS = 60_000;
export const OWNER_ACCESS_STALE_RUN_AFTER_MS =
  1.5 * OWNER_ACCESS_RUN_CHECKS * OWNER_ACCESS_POLL_INTERVAL_MS;
export const OWNER_ACCESS_STALE_RUN_CANCEL_REASON =
  'Replaced by an owner-access run on the current deployment.';
export const OWNER_ACCESS_HOOK_TOKEN_PREFIX = 'owner-access:';
export const SANITY_PENDING_INVITE_STATUS = 'pending';
export const OWNER_ACCESS_FINDING_AFTER_MS = 30 * 60_000;
export const OWNER_ACCESS_FINDING_IDENTIFIER = 'owner-access';
export const OWNER_ACCESS_LOG = {
  CHECK_FAILED: 'owner_access.check_failed',
  CHECK_NOW_FAILED: 'owner_access.check_now_failed',
  RESEND_FAILED: 'owner_access.resend_failed',
  REPORT_FAILED: 'owner_access.report_failed',
  ACTIVITY_TOUCH_FAILED: 'owner_access.activity_touch_failed',
  INVITE_DELETE_FAILED: 'owner_access.invite_delete_failed',
  FINDING_OPEN_FAILED: 'owner_access.finding_open_failed',
  SWEEP_NOT_CONFIGURED: 'owner_access.sweep_not_configured',
  SWEEP_FAILED: 'owner_access.sweep_failed',
  SWEEP_TENANT_FAILED: 'owner_access.sweep_tenant_failed',
  SWEEP_STARTED: 'owner_access.sweep_started',
  SWEEP_STEP_DONE: 'owner_access.sweep_step_done',
  SWEEP_FINISHED: 'owner_access.sweep_finished',
} as const;
export const OWNER_ACCESS_SWEEP_STEP = {
  LIST_TENANTS: 'LIST_TENANTS',
  WAKE_OWNER: 'WAKE_OWNER',
  LIST_MEMBERS: 'LIST_MEMBERS',
  WAKE_MEMBER: 'WAKE_MEMBER',
  REVOKE_LOCKED_MEMBERS: 'REVOKE_LOCKED_MEMBERS',
} as const;
