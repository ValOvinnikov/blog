export const MEMBER_ACCESS_HOOK_TOKEN_PREFIX = 'member-access:';
export const MEMBER_ACCESS_LOG = {
  CHECK_FAILED: 'member_access.check_failed',
  CHECK_NOW_FAILED: 'member_access.check_now_failed',
  RESEND_FAILED: 'member_access.resend_failed',
  REVOKE_FAILED: 'member_access.revoke_failed',
  INVITE_DELETE_FAILED: 'member_access.invite_delete_failed',
  SWEEP_MEMBER_FAILED: 'member_access.sweep_member_failed',
} as const;
