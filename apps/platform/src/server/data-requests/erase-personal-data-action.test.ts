import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  DATA_REQUEST_EMAIL,
  DATA_REQUEST_EMAIL_INDEX,
  ONE_OF_EACH_COUNT,
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

describe(erasePersonalDataAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(makeAdmin());
    erasePersonalDataMock.mockReset().mockResolvedValue({
      ok: true,
      data: { emailIndex: DATA_REQUEST_EMAIL_INDEX, erased: ONE_OF_EACH_COUNT },
    });
    recordAuditEventMock.mockReset();
  });

  it('rejects a caller who is not a super admin before erasing anything', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(
      erasePersonalDataAction({ email: DATA_REQUEST_EMAIL }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(erasePersonalDataMock).not.toHaveBeenCalled();
  });

  it('erases the email and reports how many records went', async () => {
    const result = await erasePersonalDataAction({ email: DATA_REQUEST_EMAIL });

    expect(erasePersonalDataMock).toHaveBeenCalledWith(DATA_REQUEST_EMAIL);
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: Object.keys(ONE_OF_EACH_COUNT).length,
    });
  });

  it('audits the erasure with how many of each record went', async () => {
    await erasePersonalDataAction({ email: DATA_REQUEST_EMAIL });

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.PERSONAL_DATA_ERASED,
      targetType: AUDIT_TARGET_TYPE.PERSONAL_DATA,
      targetId: DATA_REQUEST_EMAIL_INDEX,
      details: ONE_OF_EACH_COUNT,
    });
  });

  it('records nothing when the erasure fails', async () => {
    erasePersonalDataMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await erasePersonalDataAction({ email: DATA_REQUEST_EMAIL });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
