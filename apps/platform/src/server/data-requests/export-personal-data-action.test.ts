import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_EXPORT_GENERATED_AT,
  mockPersonalDataExport,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { exportPersonalDataAction } from './export-personal-data-action';

const { findPersonalDataMock } = vi.hoisted(() => ({
  findPersonalDataMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');
vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { personalData: { findPersonalData: findPersonalDataMock } },
}));

describe(exportPersonalDataAction, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_EXPORT_GENERATED_AT);
    findPersonalDataMock
      .mockReset()
      .mockResolvedValue(okResult(mockPersonalDataMatches()));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects a caller who is not a super admin before reading any data', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(async () => notFound());

    await expect(
      exportPersonalDataAction({ email: MOCK_DATA_REQUEST_EMAIL }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(findPersonalDataMock).not.toHaveBeenCalled();
  });

  it('exports every match headed by when, for whom and by which operator', async () => {
    const result = await exportPersonalDataAction({
      email: ` ${MOCK_DATA_REQUEST_EMAIL} `,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      data: mockPersonalDataExport(),
    });
  });

  it('audits the export', async () => {
    await exportPersonalDataAction({ email: MOCK_DATA_REQUEST_EMAIL });

    const { action } = firstRecordedAuditEvent(vi.mocked(recordAuditEvent));

    expect(action).toBe(AUDIT_ACTION.PERSONAL_DATA_EXPORTED);
  });
});
