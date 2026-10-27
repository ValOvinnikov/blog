import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_EXPORT_GENERATED_AT,
  mockPersonalDataExport,
  mockPersonalDataReaderAccount,
} from '@platform/testing/data-requests/fixtures';

import { toPersonalDataExportCsv } from './personal-data-export-csv';

const ROW_SEPARATOR = '\r\n';

const toRows = (csv: string) => csv.trim().split(ROW_SEPARATOR);

describe(toPersonalDataExportCsv, () => {
  it('writes one row per exported record, each kind named', () => {
    const [, ...rows] = toRows(
      toPersonalDataExportCsv(mockPersonalDataExport()),
    );

    const kinds = rows.map((row) => row.split(',')[3]);

    expect(kinds).toEqual([
      DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
      DATA_REQUEST_MATCH_KIND.LEAD,
      DATA_REQUEST_MATCH_KIND.INVITE,
      DATA_REQUEST_MATCH_KIND.READER_ACCOUNT,
      DATA_REQUEST_MATCH_KIND.BOOKMARK,
      DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
      DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
    ]);
  });

  it('starts every row with when it was made, the searched email and the operator', () => {
    const [, ...rows] = toRows(
      toPersonalDataExportCsv(mockPersonalDataExport()),
    );

    const leading = `${MOCK_EXPORT_GENERATED_AT.toISOString()},${MOCK_DATA_REQUEST_EMAIL},${mockAdmin().userId},`;

    expect(rows.every((row) => row.startsWith(leading))).toBe(true);
  });

  it('writes dates as ISO times', () => {
    const csv = toPersonalDataExportCsv(mockPersonalDataExport());

    const { createdAt } = mockPersonalDataExport().leads[0] ?? {};

    expect(csv).toContain(createdAt?.toISOString());
  });

  it('writes only the header row when nothing is stored', () => {
    const csv = toPersonalDataExportCsv({
      ...mockPersonalDataExport(),
      subscribers: [],
      leads: [],
      membershipInvites: [],
      readerAccount: undefined,
      blockedSignupIdentities: [],
      auditEvents: [],
    });

    expect(toRows(csv)).toHaveLength(1);
  });

  it('lists a reader account without bookmarks as a single row', () => {
    const csv = toPersonalDataExportCsv({
      ...mockPersonalDataExport(),
      subscribers: [],
      leads: [],
      membershipInvites: [],
      readerAccount: mockPersonalDataReaderAccount({ bookmarks: [] }),
      blockedSignupIdentities: [],
      auditEvents: [],
    });

    expect(toRows(csv)).toHaveLength(2);
  });
});
