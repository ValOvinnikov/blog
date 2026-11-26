import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  mockEmptyPersonalDataExport,
  mockPersonalDataExport,
} from '@platform/testing/data-requests/export-fixtures';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_EXPORT_GENERATED_AT,
  mockPersonalDataReaderAccount,
} from '@platform/testing/data-requests/fixtures';

import { toPersonalDataExportCsv } from './personal-data-export-csv';

const ROW_SEPARATOR = '\r\n';
const KIND_COLUMN_INDEX = 4;
const LEADING_CELLS = `${MOCK_EXPORT_GENERATED_AT.toISOString()},${MOCK_DATA_REQUEST_EMAIL},${mockAdmin().userId}`;

const toRows = (csv: string) => csv.trim().split(ROW_SEPARATOR);

describe(toPersonalDataExportCsv, () => {
  describe('with every kind of record stored', () => {
    let csv: string;
    let rows: string[];

    beforeEach(() => {
      csv = toPersonalDataExportCsv(mockPersonalDataExport());
      [, ...rows] = toRows(csv);
    });

    it('writes one row per exported record, each kind named', () => {
      const kinds = rows.map((row) => row.split(',')[KIND_COLUMN_INDEX]);

      expect(kinds).toEqual([
        DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
        DATA_REQUEST_MATCH_KIND.LEAD,
        DATA_REQUEST_MATCH_KIND.INVITE,
        DATA_REQUEST_MATCH_KIND.STUDIO_REINVITE,
        DATA_REQUEST_MATCH_KIND.SELF_SERVE_OWNER,
        DATA_REQUEST_MATCH_KIND.READER_ACCOUNT,
        DATA_REQUEST_MATCH_KIND.BOOKMARK,
        DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
        DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
      ]);
    });

    it('starts every row with its time, email, operator and whether data is held', () => {
      const leading = `${LEADING_CELLS},${true},`;

      const startsWithLeading = rows.map((row) => row.startsWith(leading));

      expect(startsWithLeading).toEqual(rows.map(() => true));
    });

    it('writes dates as ISO times', () => {
      const { createdAt } = mockPersonalDataExport().leads[0] ?? {};

      expect(csv).toContain(createdAt?.toISOString());
    });
  });

  it('writes one row stating that no data is held when nothing is stored', () => {
    const csv = toPersonalDataExportCsv(mockEmptyPersonalDataExport());

    const [, ...rows] = toRows(csv);

    expect(rows).toEqual([`${LEADING_CELLS},${false},`]);
  });

  it('lists a reader account without bookmarks as a single row', () => {
    const csv = toPersonalDataExportCsv({
      ...mockEmptyPersonalDataExport(),
      isDataHeld: true,
      readerAccount: mockPersonalDataReaderAccount({ bookmarks: [] }),
    });

    expect(toRows(csv)).toHaveLength(2);
  });
});
