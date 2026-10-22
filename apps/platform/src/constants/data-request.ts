import type { TValueOf } from '@blog/config/utils';

export const DATA_REQUEST_FIELD_ERROR = {
  EMAIL_INVALID: 'EMAIL_INVALID',
} as const;

export type TDataRequestFieldError = TValueOf<typeof DATA_REQUEST_FIELD_ERROR>;

export const DATA_REQUEST_MATCH_KIND = {
  SUBSCRIBER: 'SUBSCRIBER',
  LEAD: 'LEAD',
  INVITE: 'INVITE',
  SIGNUP_BLOCK: 'SIGNUP_BLOCK',
  AUDIT_EVENT: 'AUDIT_EVENT',
} as const;

export type TDataRequestMatchKind = TValueOf<typeof DATA_REQUEST_MATCH_KIND>;

export const DATA_REQUEST_EXPORT_FILE_NAME = 'personal-data-export.json';
