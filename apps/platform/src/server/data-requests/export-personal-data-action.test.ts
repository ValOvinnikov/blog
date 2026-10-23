import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_DATA_REQUEST_EMAIL,
  mockPersonalDataExport,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { exportPersonalDataAction } from './export-personal-data-action';

const { requireSuperAdminMock, findPersonalDataMock, recordAuditEventMock } =
  vi.hoisted(() => ({
    requireSuperAdminMock: vi.fn(),
    findPersonalDataMock: vi.fn(),
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
  queries: { personalData: { findPersonalData: findPersonalDataMock } },
}));

describe(exportPersonalDataAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(mockAdmin());
    findPersonalDataMock
      .mockReset()
      .mockResolvedValue(okResult(mockPersonalDataMatches()));
    recordAuditEventMock.mockReset();
  });

  it('rejects a caller who is not a super admin before reading any data', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(
      exportPersonalDataAction({ email: MOCK_DATA_REQUEST_EMAIL }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(findPersonalDataMock).not.toHaveBeenCalled();
  });

  it('exports every match without the email index', async () => {
    const result = await exportPersonalDataAction({
      email: MOCK_DATA_REQUEST_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      data: mockPersonalDataExport(),
    });
  });

  it('audits the export', async () => {
    await exportPersonalDataAction({ email: MOCK_DATA_REQUEST_EMAIL });

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toMatchObject({
      action: AUDIT_ACTION.PERSONAL_DATA_EXPORTED,
    });
  });
});
