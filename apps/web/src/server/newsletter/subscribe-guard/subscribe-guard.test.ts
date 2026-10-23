import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const {
  checkBotIdMock,
  headersMock,
  createRateLimiterMock,
  realCreateRateLimiter,
} = vi.hoisted(() => ({
  checkBotIdMock: vi.fn(),
  headersMock: vi.fn(),
  createRateLimiterMock: vi.fn(),
  realCreateRateLimiter: vi.fn(),
}));

vi.mock('botid/server', () => ({ checkBotId: checkBotIdMock }));
vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock(
  import('@web/server/rate-limit/rate-limiter/rate-limiter'),
  async (importOriginal) => {
    const { createRateLimiter } = await importOriginal();
    realCreateRateLimiter.mockImplementation(createRateLimiter);
    return { createRateLimiter: createRateLimiterMock };
  },
);
vi.mock('@web/utils/env/env', () => ({ env: {} }));

const SUBSCRIBE_BLOCKED_EVENT = 'newsletter.subscribe_blocked';

const loadGuard = async () => {
  vi.resetModules();
  const { logger: freshLogger } = await import('@web/utils/logger/logger');
  const { isSubscribeAttemptRefused } = await import('./subscribe-guard');
  return { isSubscribeAttemptRefused, warnMock: vi.mocked(freshLogger.warn) };
};

describe('isSubscribeAttemptRefused', () => {
  beforeEach(() => {
    checkBotIdMock.mockResolvedValue({ isBot: false });
    headersMock.mockResolvedValue(
      new Headers({ 'x-forwarded-for': '203.0.113.5' }),
    );
    createRateLimiterMock.mockImplementation(realCreateRateLimiter);
  });

  it('allows five attempts from one address and refuses the sixth', async () => {
    const { isSubscribeAttemptRefused } = await loadGuard();

    const refusals: boolean[] = [];
    for (let i = 0; i < 6; i += 1) {
      refusals.push(await isSubscribeAttemptRefused(MOCK_TENANT_ID));
    }

    expect(refusals).toEqual([false, false, false, false, false, true]);
  });

  it('counts each address separately', async () => {
    const { isSubscribeAttemptRefused } = await loadGuard();
    for (let i = 0; i < 6; i += 1) {
      await isSubscribeAttemptRefused(MOCK_TENANT_ID);
    }

    headersMock.mockResolvedValue(
      new Headers({ 'x-forwarded-for': '203.0.113.9' }),
    );

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(
      false,
    );
  });

  it('refuses a bot without counting it against the address, and logs it', async () => {
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard();
    checkBotIdMock.mockResolvedValue({ isBot: true });

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(SUBSCRIBE_BLOCKED_EVENT, {
      reason: 'bot',
    });
    expect(createRateLimiterMock).not.toHaveBeenCalled();
  });

  it('refuses and logs, without counting against the address, when BotID errors', async () => {
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard();
    checkBotIdMock.mockRejectedValue(new Error('botid down'));

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(
      SUBSCRIBE_BLOCKED_EVENT,
      expect.objectContaining({ reason: 'bot_check_unavailable' }),
    );
    expect(createRateLimiterMock).not.toHaveBeenCalled();
  });

  it('refuses and logs when the rate-limit store errors', async () => {
    createRateLimiterMock.mockReturnValue({
      isLimited: vi.fn().mockRejectedValue(new Error('redis down')),
    });
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard();

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(
      SUBSCRIBE_BLOCKED_EVENT,
      expect.objectContaining({ reason: 'rate_limit_store_unavailable' }),
    );
  });

  it('refuses when the store cannot be configured', async () => {
    createRateLimiterMock.mockImplementation(() => {
      throw new Error('missing KV config');
    });
    const { isSubscribeAttemptRefused } = await loadGuard();

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
  });

  it('refuses when the store does not answer in time', async () => {
    vi.useFakeTimers();
    createRateLimiterMock.mockReturnValue({
      isLimited: vi.fn(() => new Promise<boolean>(() => {})),
    });
    const { isSubscribeAttemptRefused } = await loadGuard();

    const refused = isSubscribeAttemptRefused(MOCK_TENANT_ID);
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(refused).resolves.toBe(true);
    vi.useRealTimers();
  });
});
