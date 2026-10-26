import { ERROR_CODE, MAGIC_LINK_REFUSAL } from '@blog/config/constants';

import { findMagicLinkSendRefusal } from './find-magic-link-send-refusal';

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

const EMAIL = 'limited@example.com';
const TAGGED_EMAIL = 'limited+promo@example.com';
const CLIENT_IP = '198.51.100.7';
const NOT_BLOCKED = { ok: true, data: false };
const BLOCKED = { ok: true, data: true };
const POSTGRES_ERROR_CODE = '57P01';
const QUERY_ERROR_NAME = 'DrizzleQueryError';

const queryErrorNaming = (...secrets: string[]) => {
  const leak = secrets.join(' ');
  const error = new Error(`Failed query: insert … params: ${leak}`, {
    cause: Object.assign(new Error(`terminating connection: ${leak}`), {
      code: POSTGRES_ERROR_CODE,
      detail: leak,
    }),
  });
  error.name = QUERY_ERROR_NAME;
  return error;
};

const DB_FAILURE = queryErrorNaming(EMAIL);
const CHECK_FAILURE = {
  reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
  errorName: QUERY_ERROR_NAME,
  errorCode: POSTGRES_ERROR_CODE,
};

const requestFrom = (ip: string) =>
  new Request('https://platform.example.com/api/auth/signin/email', {
    headers: { 'x-forwarded-for': ip },
  });

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
    withSendCounts({ email: 10, ip: 20 });

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toBeUndefined();
  });

  it('refuses a send over the per-email limit as an address limit', async () => {
    withSendCounts({ email: 11, ip: 1 });

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.ADDRESS_LIMIT });
  });

  it('refuses a send over the per-IP limit as a network limit', async () => {
    withSendCounts({ email: 1, ip: 21 });

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.NETWORK_LIMIT });
  });

  it("leaves the address's count untouched when the IP is over its limit", async () => {
    withSendCounts({ email: 1, ip: 21 });

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));

    expect(incrementMagicLinkSendCountMock).toHaveBeenCalledOnce();
  });

  it('counts the same email under the same key whatever its case', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));
    await findMagicLinkSendRefusal(EMAIL.toUpperCase(), requestFrom(CLIENT_IP));

    expect(counterKeys()[3]).toBe(counterKeys()[1]);
  });

  it('counts a +tag variant against the same address', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));
    await findMagicLinkSendRefusal(TAGGED_EMAIL, requestFrom(CLIENT_IP));

    expect(counterKeys()[3]).toBe(counterKeys()[1]);
  });

  it('stores neither the email nor the IP in a counter key', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));

    expect(counterKeys().join()).not.toMatch(
      /limited@example\.com|198\.51\.100\.7/,
    );
  });

  it('refuses a blocked address or domain as blocked', async () => {
    isSignupBlockedMock.mockResolvedValue(BLOCKED);

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.BLOCKED });
  });

  it('spends no sends on a blocked address', async () => {
    isSignupBlockedMock.mockResolvedValue(BLOCKED);

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));

    expect(incrementMagicLinkSendCountMock).not.toHaveBeenCalled();
  });

  it('checks the address it was asked to send to', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await findMagicLinkSendRefusal(EMAIL, requestFrom(CLIENT_IP));

    expect(isSignupBlockedMock).toHaveBeenCalledWith(EMAIL);
  });

  it('refuses an address the blocklist cannot read as a failed check, with its error', async () => {
    isSignupBlockedMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual({
      reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
      errorCode: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });

  it('refuses rather than throws when the blocklist check fails, carrying its name and code', async () => {
    isSignupBlockedMock.mockRejectedValue(DB_FAILURE);

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual(CHECK_FAILURE);
  });

  it('refuses rather than throws when a send counter fails, carrying its name and code', async () => {
    incrementMagicLinkSendCountMock.mockRejectedValue(DB_FAILURE);

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual(CHECK_FAILURE);
  });

  it('carries neither counter key, the address nor the IP from a failed check', async () => {
    incrementMagicLinkSendCountMock
      .mockResolvedValueOnce(1)
      .mockImplementationOnce(() =>
        Promise.reject(queryErrorNaming(...counterKeys(), EMAIL, CLIENT_IP)),
      );

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    const [ipKey, emailKey] = counterKeys();
    const serialized = JSON.stringify(result);
    expect(result).toEqual(CHECK_FAILURE);
    for (const secret of [ipKey, emailKey, EMAIL, CLIENT_IP]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('carries only the reason when what failed is not an Error', async () => {
    isSignupBlockedMock.mockRejectedValue(EMAIL);

    const result = await findMagicLinkSendRefusal(
      EMAIL,
      requestFrom(CLIENT_IP),
    );

    expect(result).toEqual({ reason: MAGIC_LINK_REFUSAL.CHECK_FAILED });
  });
});
