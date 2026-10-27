import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_DATA_REQUEST_EMAIL_INDEX,
  MOCK_ONE_OF_EACH_COUNT,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { erasePersonalDataAction } from './erase-personal-data-action';

const { erasePersonalDataMock } = vi.hoisted(() => ({
  erasePersonalDataMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');
vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { personalData: { erasePersonalData: erasePersonalDataMock } },
}));

const ERASE_EVERYTHING = {
  email: MOCK_DATA_REQUEST_EMAIL,
  includesReaderAccount: true,
};
const ERASED_RECORD_KINDS = Object.keys(MOCK_ONE_OF_EACH_COUNT).length;

describe(erasePersonalDataAction, () => {
  beforeEach(() => {
    erasePersonalDataMock.mockReset().mockResolvedValue(
      okResult({
        emailIndex: MOCK_DATA_REQUEST_EMAIL_INDEX,
        erased: MOCK_ONE_OF_EACH_COUNT,
        isReaderAccountRefused: false,
      }),
    );
  });

  it('rejects a caller who is not a super admin before erasing anything', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(async () => notFound());

    await expect(erasePersonalDataAction(ERASE_EVERYTHING)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(erasePersonalDataMock).not.toHaveBeenCalled();
  });

  it('reports how many records were erased', async () => {
    const result = await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: ERASED_RECORD_KINDS,
      isReaderAccountRefused: false,
    });
  });

  it.each([true, false])(
    'erases the email with includesReaderAccount %s',
    async (includesReaderAccount) => {
      await erasePersonalDataAction({
        ...ERASE_EVERYTHING,
        includesReaderAccount,
      });

      expect(erasePersonalDataMock).toHaveBeenCalledWith(
        MOCK_DATA_REQUEST_EMAIL,
        { includesReaderAccount },
      );
    },
  );

  it('reports a reader account the data layer refused to delete', async () => {
    erasePersonalDataMock.mockResolvedValue(
      okResult({
        emailIndex: MOCK_DATA_REQUEST_EMAIL_INDEX,
        erased: { ...MOCK_ONE_OF_EACH_COUNT, readerAccounts: 0 },
        isReaderAccountRefused: true,
      }),
    );

    const result = await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: ERASED_RECORD_KINDS - 1,
      isReaderAccountRefused: true,
    });
  });

  it('audits the erasure with how many of each record went', async () => {
    await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(firstRecordedAuditEvent(vi.mocked(recordAuditEvent))).toEqual({
      action: AUDIT_ACTION.PERSONAL_DATA_ERASED,
      targetType: AUDIT_TARGET_TYPE.PERSONAL_DATA,
      targetId: MOCK_DATA_REQUEST_EMAIL_INDEX,
      details: MOCK_ONE_OF_EACH_COUNT,
    });
  });

  it('records nothing when the erasure fails', async () => {
    erasePersonalDataMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
