import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { okResult } from '@blog/utils';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_DATA_REQUEST_EMAIL,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { lookUpPersonalDataAction } from './look-up-personal-data-action';
import { toDataRequestMatches } from './to-data-request-matches';

const { requireSuperAdminMock, findPersonalDataMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  findPersonalDataMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { personalData: { findPersonalData: findPersonalDataMock } },
}));

describe(lookUpPersonalDataAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(mockAdmin());
    findPersonalDataMock
      .mockReset()
      .mockResolvedValue(okResult(mockPersonalDataMatches()));
  });

  it('rejects a caller who is not a super admin before searching', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(
      lookUpPersonalDataAction({ email: MOCK_DATA_REQUEST_EMAIL }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(findPersonalDataMock).not.toHaveBeenCalled();
  });

  it('returns every match found for the email', async () => {
    const result = await lookUpPersonalDataAction({
      email: MOCK_DATA_REQUEST_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: toDataRequestMatches(mockPersonalDataMatches()),
      readerAccount: mockPersonalDataMatches().readerAccount,
    });
  });

  it('returns a server error when the search fails', async () => {
    findPersonalDataMock.mockRejectedValue(new Error('db down'));

    const result = await lookUpPersonalDataAction({
      email: MOCK_DATA_REQUEST_EMAIL,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
