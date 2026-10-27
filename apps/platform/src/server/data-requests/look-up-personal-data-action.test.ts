import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_DATA_REQUEST_EMAIL,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { lookUpPersonalDataAction } from './look-up-personal-data-action';
import { toDataRequestMatches } from './to-data-request-matches';

faker.seed(5998);

const { findPersonalDataMock } = vi.hoisted(() => ({
  findPersonalDataMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');
vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { personalData: { findPersonalData: findPersonalDataMock } },
}));

describe(lookUpPersonalDataAction, () => {
  beforeEach(() => {
    findPersonalDataMock
      .mockReset()
      .mockResolvedValue(okResult(mockPersonalDataMatches()));
  });

  it('rejects a caller who is not a super admin before searching', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(async () => notFound());

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
    findPersonalDataMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await lookUpPersonalDataAction({
      email: MOCK_DATA_REQUEST_EMAIL,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
