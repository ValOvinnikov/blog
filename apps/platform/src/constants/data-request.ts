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

export const DATA_REQUEST_KIND_FILTER = {
  ALL: 'ALL',
  ...DATA_REQUEST_MATCH_KIND,
} as const;

export type TDataRequestKindFilter = TValueOf<typeof DATA_REQUEST_KIND_FILTER>;

export const DATA_REQUEST_MATCH_COLUMN = {
  KIND: 'KIND',
  SITE: 'SITE',
  EMAIL: 'EMAIL',
  RECORDED: 'RECORDED',
} as const;

export type TDataRequestMatchColumn = TValueOf<
  typeof DATA_REQUEST_MATCH_COLUMN
>;

export const DATA_REQUEST_MATCHES_PAGE_SIZE = 25;

export const DATA_REQUEST_EXPORT_FORMAT = {
  JSON: 'JSON',
  CSV: 'CSV',
} as const;

export type TDataRequestExportFormat = TValueOf<
  typeof DATA_REQUEST_EXPORT_FORMAT
>;

export const DATA_REQUEST_EXPORT_FILE_PREFIX = 'personal-data-export';

export const DATA_REQUEST_LOG = {
  AUDIT_FAILED: 'data_request.audit_failed',
  FAILED: 'data_request.failed',
} as const;
