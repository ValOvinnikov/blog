import type { TValueOf } from '@blog/config/utils';

export const EMAIL_LOGO_KIND = {
  SENDER: 'SENDER',
  TEMPLATE: 'TEMPLATE',
} as const;

export type TEmailLogoKind = TValueOf<typeof EMAIL_LOGO_KIND>;

export const EMAIL_LOGO_LOG = {
  CLEAR_AUDIT_FAILED: 'email_logo.clear_audit_failed',
  CLEAR_FAILED: 'email_logo.clear_failed',
  DELETE_FAILED: 'email_logo.delete_failed',
  UPLOAD_AUDIT_FAILED: 'email_logo.upload_audit_failed',
  UPLOAD_FAILED: 'email_logo.upload_failed',
} as const;
