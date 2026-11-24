import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TValueOf } from '@shinefold/config/utils';
import {
  ADMIN_INVITE_OUTCOME,
  ADMIN_REMOVAL_OUTCOME,
  ADMIN_ROLE,
  MEMBERSHIP_REMOVAL_OUTCOME,
} from '@shinefold/db/constants';

export const INVITABLE_ADMIN_ROLE = {
  ADMIN: ADMIN_ROLE.ADMIN,
  SUPERADMIN: ADMIN_ROLE.SUPERADMIN,
} as const;

export type TInvitableAdminRole = TValueOf<typeof INVITABLE_ADMIN_ROLE>;

export const ADMIN_INVITE_FIELD_ERROR = {
  EMAIL_INVALID: TENANT_FIELD_ERROR.EMAIL_INVALID,
  ROLE_INVALID: 'ROLE_INVALID',
  ALREADY_ADMIN: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN,
} as const;

export type TAdminInviteFieldError = TValueOf<typeof ADMIN_INVITE_FIELD_ERROR>;

export const PLATFORM_ADMIN_REFUSAL = {
  NOT_FOUND: TENANT_REFUSAL.NOT_FOUND,
  SELF: MEMBERSHIP_REMOVAL_OUTCOME.SELF,
  LAST_SUPERADMIN: ADMIN_REMOVAL_OUTCOME.LAST_SUPERADMIN,
  ALREADY_ADMIN: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN,
} as const;

export type TPlatformAdminRefusal = TValueOf<typeof PLATFORM_ADMIN_REFUSAL>;

export const ADMINS_HEADING_ID = 'admins-heading';

export const ADMIN_INVITES_HEADING_ID = 'admin-invites-heading';

export const PLATFORM_ADMIN_LOG = {
  INVITE_FAILED: 'platform_admin.invite_failed',
  INVITE_EMAIL_FAILED: 'platform_admin.invite_email_failed',
  INVITE_AUDIT_FAILED: 'platform_admin.invite_audit_failed',
  RESEND_FAILED: 'platform_admin.resend_failed',
  RESEND_EMAIL_FAILED: 'platform_admin.resend_email_failed',
  CANCEL_FAILED: 'platform_admin.cancel_failed',
  CANCEL_AUDIT_FAILED: 'platform_admin.cancel_audit_failed',
  REMOVE_FAILED: 'platform_admin.remove_failed',
  REMOVE_AUDIT_FAILED: 'platform_admin.remove_audit_failed',
} as const;
