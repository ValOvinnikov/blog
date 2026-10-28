import type { TMaybeUndefined } from '@blog/config';
import type { TPersonalDataReaderAccount } from '@blog/db/queries/personal-data/reader-account-personal-data';
import { toCsv, type TCsvCell } from '@blog/utils/csv';
import {
  DATA_REQUEST_MATCH_KIND,
  type TDataRequestMatchKind,
} from '@platform/constants/data-request';
import type {
  TPersonalDataExport,
  TPersonalDataExportHeader,
} from '@platform/server/data-requests/export-personal-data-action';

type TExportRecord = {
  kind: TDataRequestMatchKind;
  fields: Record<string, unknown>;
};

const HEADER_COLUMNS = [
  'generatedAt',
  'searchedEmail',
  'operatorId',
] as const satisfies readonly (keyof TPersonalDataExportHeader)[];

const KIND_COLUMN = 'kind';

const toCell = (value: unknown): TCsvCell => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return undefined;
};

const withKind = (
  kind: TDataRequestMatchKind,
  records: readonly object[],
): TExportRecord[] =>
  records.map((fields) => ({ kind, fields: { ...fields } }));

const toReaderAccountRecords = (
  readerAccount: TMaybeUndefined<TPersonalDataReaderAccount>,
): TExportRecord[] => {
  if (!readerAccount) return [];

  const { bookmarks, ...account } = readerAccount;
  return [
    ...withKind(DATA_REQUEST_MATCH_KIND.READER_ACCOUNT, [account]),
    ...withKind(DATA_REQUEST_MATCH_KIND.BOOKMARK, bookmarks),
  ];
};

const toExportRecords = ({
  subscribers,
  leads,
  membershipInvites,
  unsentStudioReinvites,
  readerAccount,
  blockedSignupIdentities,
  auditEvents,
}: TPersonalDataExport): TExportRecord[] => {
  return [
    ...withKind(DATA_REQUEST_MATCH_KIND.SUBSCRIBER, subscribers),
    ...withKind(DATA_REQUEST_MATCH_KIND.LEAD, leads),
    ...withKind(DATA_REQUEST_MATCH_KIND.INVITE, membershipInvites),
    ...withKind(DATA_REQUEST_MATCH_KIND.STUDIO_REINVITE, unsentStudioReinvites),
    ...toReaderAccountRecords(readerAccount),
    ...withKind(DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK, blockedSignupIdentities),
    ...withKind(DATA_REQUEST_MATCH_KIND.AUDIT_EVENT, auditEvents),
  ];
};

export const toPersonalDataExportCsv = (data: TPersonalDataExport): string => {
  const records = toExportRecords(data);
  const fieldColumns = [
    ...new Set(records.flatMap(({ fields }) => Object.keys(fields))),
  ];
  const header = HEADER_COLUMNS.map((column) => data[column]);

  return toCsv([
    [...HEADER_COLUMNS, KIND_COLUMN, ...fieldColumns],
    ...records.map(({ kind, fields }) => [
      ...header,
      kind,
      ...fieldColumns.map((column) => toCell(fields[column])),
    ]),
  ]);
};
