import { MOCK_EMAIL } from '@blog/auth/testing/session-fixtures';
import { ERROR_CODE, MAGIC_LINK_REFUSAL } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { findMagicLinkSendRefusal } from './find-magic-link-send-refusal';

faker.seed(6027);

const { incrementMagicLinkSendCountMock, isSignupBlockedMock } = vi.hoisted(
  () => ({
    incrementMagicLinkSendCountMock: vi.fn(),
    isSignupBlockedMock: vi.fn(),
  }),
);

vi.mock('@blog/db', () => ({
  queries: {
    blockedSignupIdentities: { isSignupBlocked: isSignupBlockedMock },
    magicLinkSendCounters: {
      incrementMagicLinkSendCount: incrementMagicLinkSendCountMock,
    },
  },
}));

const EMAIL_SEND_LIMIT = 10;
const IP_SEND_LIMIT = 20;
const MOCK_TAGGED_EMAIL = MOCK_EMAIL.replace('@', '+promo@');
const MOCK_CLIENT_IP = faker.internet.ipv4();
const MOCK_POSTGRES_ERROR_CODE = '57P01';
const MOCK_QUERY_ERROR_NAME = 'DrizzleQueryError';
const NOT_BLOCKED = { ok: true, data: false };
const BLOCKED = { ok: true, data: true };

const queryErrorNaming = (...secrets: string[]) => {
  const leak = secrets.join(' ');
  const error = new Error(`Failed query: insert … params: ${leak}`, {
    cause: Object.assign(new Error(`terminating connection: ${leak}`), {
      code: MOCK_POSTGRES_ERROR_CODE,
      detail: leak,
    }),
  });
  error.name = MOCK_QUERY_ERROR_NAME;
  return error;
};

const DB_FAILURE = queryErrorNaming(MOCK_EMAIL);
const CHECK_FAILURE = {
  reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
  errorName: MOCK_QUERY_ERROR_NAME,
  errorCode: MOCK_POSTGRES_ERROR_CODE,
};

const requestFromClient = () =>
  new Request(faker.internet.url(), {
    headers: { 'x-forwarded-for': MOCK_CLIENT_IP },
  });

const findRefusalFor = (email = MOCK_EMAIL) =>
  findMagicLinkSendRefusal(email, requestFromClient());

const withSendCounts = ({ email, ip }: { email: number; ip: number }) => {
  incrementMagicLinkSendCountMock
    .mockResolvedValueOnce(ip)
    .mockResolvedValueOnce(email)
    .mockResolvedValue(1);
};

const counterKeys = () =>
  incrementMagicLinkSendCountMock.mock.calls.map(([key]) => key);

describe(findMagicLinkSendRefusal, () => {
  beforeEach(() => {
    isSignupBlockedMock.mockResolvedValue(NOT_BLOCKED);
  });

  it('allows a send within both limits', async () => {
    withSendCounts({ email: EMAIL_SEND_LIMIT, ip: IP_SEND_LIMIT });

    const result = await findRefusalFor();

    expect(result).toBeUndefined();
  });

  it.each([
    [
      'the per-email limit as an address limit',
      { email: EMAIL_SEND_LIMIT + 1, ip: 1 },
      MAGIC_LINK_REFUSAL.ADDRESS_LIMIT,
    ],
    [
      'the per-IP limit as a network limit',
      { email: 1, ip: IP_SEND_LIMIT + 1 },
      MAGIC_LINK_REFUSAL.NETWORK_LIMIT,
    ],
  ])('refuses a send over %s', async (_, counts, reason) => {
    withSendCounts(counts);

    const result = await findRefusalFor();

    expect(result).toEqual({ reason });
  });

  it("leaves the address's count untouched when the IP is over its limit", async () => {
    withSendCounts({ email: 1, ip: IP_SEND_LIMIT + 1 });

    await findRefusalFor();

    expect(incrementMagicLinkSendCountMock).toHaveBeenCalledOnce();
  });

  describe('within both limits', () => {
    beforeEach(() => {
      withSendCounts({ email: 1, ip: 1 });
    });

    it.each([
      ['an upper-cased', MOCK_EMAIL.toUpperCase()],
      ['a +tag', MOCK_TAGGED_EMAIL],
    ])(
      'counts %s variant under the same key as the address',
      async (_, variant) => {
        await findRefusalFor();
        await findRefusalFor(variant);

        const [, emailKey, , variantKey] = counterKeys();
        expect(variantKey).toBe(emailKey);
      },
    );

    it('stores neither the email nor the IP in a counter key', async () => {
      await findRefusalFor();

      const keys = counterKeys().join();
      expect(keys).not.toContain(MOCK_EMAIL);
      expect(keys).not.toContain(MOCK_CLIENT_IP);
    });

    it('checks the address it was asked to send to', async () => {
      await findRefusalFor();

      expect(isSignupBlockedMock).toHaveBeenCalledWith(MOCK_EMAIL);
    });
  });

  describe('for a blocked address or domain', () => {
    beforeEach(() => {
      isSignupBlockedMock.mockResolvedValue(BLOCKED);
    });

    it('refuses the send as blocked', async () => {
      const result = await findRefusalFor();

      expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.BLOCKED });
    });

    it('spends no sends', async () => {
      await findRefusalFor();

      expect(incrementMagicLinkSendCountMock).not.toHaveBeenCalled();
    });
  });

  it('refuses an address the blocklist cannot read as a failed check', async () => {
    isSignupBlockedMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });

    const result = await findRefusalFor();

    expect(result).toEqual({
      reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
      errorCode: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });

  it.each([
    ['the blocklist check', isSignupBlockedMock],
    ['a send counter', incrementMagicLinkSendCountMock],
  ])(
    'refuses rather than throws when %s fails, carrying its name and code',
    async (_, failingMock) => {
      failingMock.mockRejectedValue(DB_FAILURE);

      const result = await findRefusalFor();

      expect(result).toEqual(CHECK_FAILURE);
    },
  );

  it('carries neither counter key, the address nor the IP from a failed check', async () => {
    incrementMagicLinkSendCountMock
      .mockResolvedValueOnce(1)
      .mockImplementationOnce(() =>
        Promise.reject(
          queryErrorNaming(...counterKeys(), MOCK_EMAIL, MOCK_CLIENT_IP),
        ),
      );

    const result = await findRefusalFor();

    const [ipKey, emailKey] = counterKeys();
    const serialized = JSON.stringify(result);
    expect(result).toEqual(CHECK_FAILURE);
    for (const secret of [ipKey, emailKey, MOCK_EMAIL, MOCK_CLIENT_IP]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('carries only the reason when what failed is not an Error', async () => {
    isSignupBlockedMock.mockRejectedValue(MOCK_EMAIL);

    const result = await findRefusalFor();

    expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.CHECK_FAILED });
  });
});
