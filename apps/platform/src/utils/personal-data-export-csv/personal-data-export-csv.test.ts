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
const KIND_COLUMN_INDEX = 3;

const toRows = (csv: string) => csv.trim().split(ROW_SEPARATOR);

const mockEmptyPersonalDataExport = () => ({
  ...mockPersonalDataExport(),
  subscribers: [],
  leads: [],
  membershipInvites: [],
  unsentStudioReinvites: [],
  readerAccount: undefined,
  blockedSignupIdentities: [],
  auditEvents: [],
});

describe(toPersonalDataExportCsv, () => {
  describe('with every kind of record stored', () => {
    let csv: string;

    beforeEach(() => {
      csv = toPersonalDataExportCsv(mockPersonalDataExport());
    });

    it('writes one row per exported record, each kind named', () => {
      const [, ...rows] = toRows(csv);

      const kinds = rows.map((row) => row.split(',')[KIND_COLUMN_INDEX]);

      expect(kinds).toEqual([
        DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
        DATA_REQUEST_MATCH_KIND.LEAD,
        DATA_REQUEST_MATCH_KIND.INVITE,
        DATA_REQUEST_MATCH_KIND.STUDIO_REINVITE,
        DATA_REQUEST_MATCH_KIND.READER_ACCOUNT,
        DATA_REQUEST_MATCH_KIND.BOOKMARK,
        DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
        DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
      ]);
    });

    it('starts every row with its time, the searched email and the operator', () => {
      const [, ...rows] = toRows(csv);
      const leading = `${MOCK_EXPORT_GENERATED_AT.toISOString()},${MOCK_DATA_REQUEST_EMAIL},${mockAdmin().userId},`;

      const startsWithLeading = rows.map((row) => row.startsWith(leading));

      expect(startsWithLeading).toEqual(rows.map(() => true));
    });

    it('writes dates as ISO times', () => {
      const { createdAt } = mockPersonalDataExport().leads[0] ?? {};

      expect(csv).toContain(createdAt?.toISOString());
    });
  });

  it('writes only the header row when nothing is stored', () => {
    const csv = toPersonalDataExportCsv(mockEmptyPersonalDataExport());

    expect(toRows(csv)).toHaveLength(1);
  });

  it('lists a reader account without bookmarks as a single row', () => {
    const csv = toPersonalDataExportCsv({
      ...mockEmptyPersonalDataExport(),
      readerAccount: mockPersonalDataReaderAccount({ bookmarks: [] }),
    });

    expect(toRows(csv)).toHaveLength(2);
  });
});
