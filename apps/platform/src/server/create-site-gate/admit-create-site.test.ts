import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import { takeCreateSiteSlot } from '@platform/server/create-site-gate/create-site-gate';
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

const { isSignupBlockedMock } = vi.hoisted(() => ({
  isSignupBlockedMock: vi.fn(),
}));

vi.mock('@platform/server/create-site-gate/create-site-gate', () => ({
  takeCreateSiteSlot: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: { isSignupBlocked: isSignupBlockedMock },
  },
}));

faker.seed(5998);

const takeSlotMock = vi.mocked(takeCreateSiteSlot);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_CLIENT_KEY = faker.internet.ipv4();
const MOCK_NOW = faker.date.past({ refDate: new Date('2026-10-21T09:00:00Z') });
const MOCK_SIGN_UP = {
  clientKey: MOCK_CLIENT_KEY,
  email: MOCK_BLOCKED_OWNER_EMAIL,
};

describe(admitCreateSite, () => {
  beforeEach(() => {
    isSignupBlockedMock.mockReset().mockResolvedValue(okResult(false));
    takeSlotMock.mockReset().mockResolvedValue(true);
  });

  it('admits an email that is not blocked while a slot is free', async () => {
    const admitted = await admitCreateSite({ ...MOCK_SIGN_UP, now: MOCK_NOW });

    expect(admitted).toBe(true);
    expect(isSignupBlockedMock).toHaveBeenCalledWith(MOCK_BLOCKED_OWNER_EMAIL);
    expect(takeSlotMock).toHaveBeenCalledWith(MOCK_CLIENT_KEY, MOCK_NOW);
  });

  it('refuses a blocked email without taking a slot', async () => {
    isSignupBlockedMock.mockResolvedValue(okResult(true));

    const admitted = await admitCreateSite(MOCK_SIGN_UP);

    expect(admitted).toBe(false);
    expect(takeSlotMock).not.toHaveBeenCalled();
  });

  it('refuses an unblocked email once the daily limits are spent', async () => {
    takeSlotMock.mockResolvedValue(false);

    const admitted = await admitCreateSite(MOCK_SIGN_UP);

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

      const admitted = await admitCreateSite(MOCK_SIGN_UP);

      expect(admitted).toBe(false);
      expect(takeSlotMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
        CREATE_SITE_GATE_LOG.BLOCK_CHECK_FAILED,
        logged,
      );
    },
  );
});
