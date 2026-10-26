import type { TValueOf } from '@blog/config/utils';

export const DATA_REQUEST_MATCH_KIND = {
  SUBSCRIBER: 'SUBSCRIBER',
  LEAD: 'LEAD',
  INVITE: 'INVITE',
  SIGNUP_BLOCK: 'SIGNUP_BLOCK',
  AUDIT_EVENT: 'AUDIT_EVENT',
  READER_ACCOUNT: 'READER_ACCOUNT',
  BOOKMARK: 'BOOKMARK',
} as const;

export type TDataRequestMatchKind = TValueOf<typeof DATA_REQUEST_MATCH_KIND>;

export const DATA_REQUEST_EXPORT_FORMAT = {
  JSON: 'JSON',
  CSV: 'CSV',
} as const;

export type TDataRequestExportFormat = TValueOf<
  typeof DATA_REQUEST_EXPORT_FORMAT
>;

export const DATA_REQUEST_EXPORT_FILE_NAME = {
  JSON: 'personal-data-export.json',
  CSV: 'personal-data-export.csv',
} as const satisfies Record<TDataRequestExportFormat, string>;

export const DATA_REQUEST_LOG = {
  AUDIT_FAILED: 'data_request.audit_failed',
  FAILED: 'data_request.failed',
} as const;
