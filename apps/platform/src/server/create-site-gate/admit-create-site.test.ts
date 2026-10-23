import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { takeCreateSiteSlot } from '@platform/server/create-site-gate/create-site-gate';
import { BLOCKED_OWNER_EMAIL } from '@platform/testing/blocked-signups/fixtures';
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

const takeSlotMock = vi.mocked(takeCreateSiteSlot);
const loggerErrorMock = vi.mocked(logger.error);

const CLIENT_KEY = '203.0.113.7';
const NOW = new Date('2026-10-21T09:00:00Z');
const SIGN_UP = { clientKey: CLIENT_KEY, email: BLOCKED_OWNER_EMAIL };

describe(admitCreateSite, () => {
  beforeEach(() => {
    isSignupBlockedMock.mockReset().mockResolvedValue(okResult(false));
    takeSlotMock.mockReset().mockResolvedValue(true);
    loggerErrorMock.mockReset();
  });

  it('admits an email that is not blocked while a slot is free', async () => {
    const admitted = await admitCreateSite({ ...SIGN_UP, now: NOW });

    expect(admitted).toBe(true);
    expect(isSignupBlockedMock).toHaveBeenCalledWith(BLOCKED_OWNER_EMAIL);
    expect(takeSlotMock).toHaveBeenCalledWith(CLIENT_KEY, NOW);
  });

  it('refuses a blocked email without taking a slot', async () => {
    isSignupBlockedMock.mockResolvedValue(okResult(true));

    const admitted = await admitCreateSite(SIGN_UP);

    expect(admitted).toBe(false);
    expect(takeSlotMock).not.toHaveBeenCalled();
  });

  it('refuses an email that is not blocked once the daily limits are spent', async () => {
    takeSlotMock.mockResolvedValue(false);

    const admitted = await admitCreateSite(SIGN_UP);

    expect(admitted).toBe(false);
  });

  it('refuses and logs when the blocklist lookup fails', async () => {
    isSignupBlockedMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_INVALID_EMAIL),
    );

    const admitted = await admitCreateSite(SIGN_UP);
    const [, context] = loggerErrorMock.mock.calls[0] ?? [];

    expect(admitted).toBe(false);
    expect(takeSlotMock).not.toHaveBeenCalled();
    expect(context).toEqual({ error: ERROR_CODE.DB_INVALID_EMAIL });
  });

  it('refuses and logs when the blocklist lookup throws', async () => {
    const failure = new Error('db down');
    isSignupBlockedMock.mockRejectedValue(failure);

    const admitted = await admitCreateSite(SIGN_UP);
    const [, context] = loggerErrorMock.mock.calls[0] ?? [];

    expect(admitted).toBe(false);
    expect(takeSlotMock).not.toHaveBeenCalled();
    expect(context).toEqual({ error: failure });
  });
});
