import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TValueOf } from '@shinefold/config/utils';
import {
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_REMOVAL_OUTCOME,
} from '@shinefold/db/constants';

export const TEAM_INVITE_FIELD_ERROR = {
  EMAIL_INVALID: TENANT_FIELD_ERROR.EMAIL_INVALID,
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  ALREADY_INVITED: 'ALREADY_INVITED',
  SEAT_LIMIT: MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT,
} as const;

export type TTeamInviteFieldError = TValueOf<typeof TEAM_INVITE_FIELD_ERROR>;

export const TEAM_REFUSAL = {
  NOT_FOUND: TENANT_REFUSAL.NOT_FOUND,
  SELF: MEMBERSHIP_REMOVAL_OUTCOME.SELF,
  LAST_OWNER: MEMBERSHIP_REMOVAL_OUTCOME.LAST_OWNER,
  OWNER_INVITE: 'OWNER_INVITE',
} as const;

export type TTeamRefusal = TValueOf<typeof TEAM_REFUSAL>;

export const MEMBER_ACCESS_PATH = {
  CHECK: '/api/member-access/check',
  RESEND: '/api/member-access/resend',
  REVOKE: '/api/member-access/revoke',
} as const;

// The waits before the second and third revoke attempts.
export const MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS = [1000, 3000] as const;

export const TEAM_ACCESS_LOG = {
  INVITE_FAILED: 'team_access.invite_failed',
  INVITE_EMAIL_FAILED: 'team_access.invite_email_failed',
  INVITE_AUDIT_FAILED: 'team_access.invite_audit_failed',
  REMOVE_FAILED: 'team_access.remove_failed',
  REMOVE_AUDIT_FAILED: 'team_access.remove_audit_failed',
  REVOKE_FAILED: 'team_access.revoke_failed',
  REVOKE_SKIPPED_NO_EMAIL: 'team_access.revoke_skipped_no_email',
  CANCEL_FAILED: 'team_access.cancel_failed',
  CANCEL_AUDIT_FAILED: 'team_access.cancel_audit_failed',
  ACCESS_REQUEST_FAILED: 'team_access.access_request_failed',
} as const;
