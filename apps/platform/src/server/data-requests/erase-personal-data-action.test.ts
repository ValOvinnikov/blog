import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_DATA_REQUEST_EMAIL_INDEX,
  MOCK_ONE_OF_EACH_COUNT,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { erasePersonalDataAction } from './erase-personal-data-action';

const { requireSuperAdminMock, erasePersonalDataMock, recordAuditEventMock } =
  vi.hoisted(() => ({
    requireSuperAdminMock: vi.fn(),
    erasePersonalDataMock: vi.fn(),
    recordAuditEventMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { personalData: { erasePersonalData: erasePersonalDataMock } },
}));

const ERASE_EVERYTHING = {
  email: MOCK_DATA_REQUEST_EMAIL,
  includesReaderAccount: true,
};

describe(erasePersonalDataAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(mockAdmin());
    erasePersonalDataMock.mockReset().mockResolvedValue(
      okResult({
        emailIndex: MOCK_DATA_REQUEST_EMAIL_INDEX,
        erased: MOCK_ONE_OF_EACH_COUNT,
        isReaderAccountRefused: false,
      }),
    );
    recordAuditEventMock.mockReset();
  });

  it('rejects a caller who is not a super admin before erasing anything', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(erasePersonalDataAction(ERASE_EVERYTHING)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(erasePersonalDataMock).not.toHaveBeenCalled();
  });

  it('erases the email and reports how many records went', async () => {
    const result = await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(erasePersonalDataMock).toHaveBeenCalledWith(
      MOCK_DATA_REQUEST_EMAIL,
      { includesReaderAccount: true },
    );
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: Object.keys(MOCK_ONE_OF_EACH_COUNT).length,
      isReaderAccountRefused: false,
    });
  });

  it('leaves the reader account out when the operator unticks it', async () => {
    await erasePersonalDataAction({
      ...ERASE_EVERYTHING,
      includesReaderAccount: false,
    });

    expect(erasePersonalDataMock).toHaveBeenCalledWith(
      MOCK_DATA_REQUEST_EMAIL,
      { includesReaderAccount: false },
    );
  });

  it('reports a reader account the data layer refused to delete', async () => {
    erasePersonalDataMock.mockResolvedValue(
      okResult({
        emailIndex: MOCK_DATA_REQUEST_EMAIL_INDEX,
        erased: { ...MOCK_ONE_OF_EACH_COUNT, readerAccounts: 0 },
        isReaderAccountRefused: true,
      }),
    );

    const result = await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(result).toMatchObject({ isReaderAccountRefused: true });
  });

  it('audits the erasure with how many of each record went', async () => {
    await erasePersonalDataAction(ERASE_EVERYTHING);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
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
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
