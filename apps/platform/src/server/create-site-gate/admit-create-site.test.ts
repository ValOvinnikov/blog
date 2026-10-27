import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import {
  MOCK_BLOCKED_ADDRESS_HASH,
  MOCK_BLOCKED_OWNER_EMAIL,
} from '@platform/testing/blocked-signups/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';

import { admitCreateSite } from './admit-create-site';
import { MAX_SITES_PER_IP_PER_DAY } from './create-site-gate';

const { isSignupBlockedMock } = vi.hoisted(() => ({
  isSignupBlockedMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: { isSignupBlocked: isSignupBlockedMock },
  },
}));

faker.seed(5998);

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_NOW = faker.date.past({ refDate: new Date('2026-10-21T09:00:00Z') });

const admitRepeatedly = async (
  times: number,
  signUp: Parameters<typeof admitCreateSite>[0],
): Promise<boolean[]> => {
  const results: boolean[] = [];
  for (let index = 0; index < times; index += 1) {
    results.push(await admitCreateSite(signUp));
  }
  return results;
};

describe(admitCreateSite, () => {
  let signUp: Parameters<typeof admitCreateSite>[0];

  beforeEach(() => {
    isSignupBlockedMock.mockReset().mockResolvedValue(okResult(false));
    signUp = {
      clientKey: faker.internet.ipv4(),
      email: MOCK_BLOCKED_OWNER_EMAIL,
      now: MOCK_NOW,
    };
  });

  it('admits an email that is not blocked while a slot is free', async () => {
    const admitted = await admitCreateSite(signUp);

    expect(admitted).toBe(true);
    expect(isSignupBlockedMock).toHaveBeenCalledWith(MOCK_BLOCKED_OWNER_EMAIL);
  });

  it('refuses a blocked email without taking a slot', async () => {
    isSignupBlockedMock.mockResolvedValueOnce(okResult(true));

    const admitted = await admitCreateSite(signUp);
    const laterAdmissions = await admitRepeatedly(
      MAX_SITES_PER_IP_PER_DAY,
      signUp,
    );

    expect(admitted).toBe(false);
    expect(laterAdmissions.every(Boolean)).toBe(true);
  });

  it('refuses an unblocked email once the daily limits are spent', async () => {
    await admitRepeatedly(MAX_SITES_PER_IP_PER_DAY, signUp);

    const admitted = await admitCreateSite(signUp);

    expect(admitted).toBe(false);
  });

  it.each([
    [
      'fails',
      () =>
        isSignupBlockedMock.mockResolvedValue(
          errorResult(ERROR_CODE.DB_INVALID_EMAIL),
        ),
      { errorCode: ERROR_CODE.DB_INVALID_EMAIL },
    ],
    [
      'throws',
      () =>
        isSignupBlockedMock.mockRejectedValue(
          mockQueryError(MOCK_BLOCKED_OWNER_EMAIL, MOCK_BLOCKED_ADDRESS_HASH),
        ),
      {
        errorName: MOCK_QUERY_ERROR_NAME,
        errorCode: MOCK_POSTGRES_ERROR_CODE,
      },
    ],
  ])(
    'refuses and logs only the error name and code when the lookup %s',
    async (_, failLookup, logged) => {
      failLookup();

      const admitted = await admitCreateSite(signUp);

      expect(admitted).toBe(false);
      expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
        CREATE_SITE_GATE_LOG.BLOCK_CHECK_FAILED,
        logged,
      );
    },
  );
});
