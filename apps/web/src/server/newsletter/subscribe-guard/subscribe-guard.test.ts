import { FORWARDED_FOR_HEADER } from '@blog/utils/client-key';
import { faker } from '@faker-js/faker';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const { checkBotIdMock, headersMock, createRedisRateLimitStoreMock } =
  vi.hoisted(() => ({
    checkBotIdMock: vi.fn(),
    headersMock: vi.fn(),
    createRedisRateLimitStoreMock: vi.fn(),
  }));

vi.mock('botid/server', () => ({ checkBotId: checkBotIdMock }));
vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock(
  '@web/server/rate-limit/redis-rate-limit-store/redis-rate-limit-store',
  () => ({ createRedisRateLimitStore: createRedisRateLimitStoreMock }),
);
vi.mock('@web/utils/env/env', () => ({ env: {} }));

faker.seed(7411);

const SUBSCRIBE_BLOCKED_EVENT = 'newsletter.subscribe_blocked';
const MOCK_CLIENT_IP = faker.internet.ipv4();
const MOCK_OTHER_CLIENT_IP = faker.internet.ipv4();
const MOCK_KV_URL = faker.internet.url();
const MOCK_KV_TOKEN = faker.string.alphanumeric(24);
const ATTEMPTS_BEFORE_REFUSAL = 5;
const STORE_TIMEOUT_MS = 2_000;

const clientHeaders = (ip: string) =>
  new Headers({ [FORWARDED_FOR_HEADER]: ip });

const loadGuard = async ({ withKvStore = false } = {}) => {
  vi.resetModules();
  const { env } = await import('@web/utils/env/env');
  if (withKvStore) {
    Object.assign(env, {
      KV_REST_API_URL: MOCK_KV_URL,
      KV_REST_API_TOKEN: MOCK_KV_TOKEN,
    });
  }
  const { logger } = await import('@web/utils/logger/logger');
  const { isSubscribeAttemptRefused } = await import('./subscribe-guard');
  return { isSubscribeAttemptRefused, warnMock: vi.mocked(logger.warn) };
};

describe('isSubscribeAttemptRefused', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    checkBotIdMock.mockResolvedValue({ isBot: false });
    headersMock.mockResolvedValue(clientHeaders(MOCK_CLIENT_IP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows five attempts from one address and refuses the sixth', async () => {
    const { isSubscribeAttemptRefused } = await loadGuard();

    const refusals: boolean[] = [];
    for (let i = 0; i <= ATTEMPTS_BEFORE_REFUSAL; i += 1) {
      refusals.push(await isSubscribeAttemptRefused(MOCK_TENANT_ID));
    }

    expect(refusals).toEqual([false, false, false, false, false, true]);
  });

  it('counts each address separately', async () => {
    const { isSubscribeAttemptRefused } = await loadGuard();
    for (let i = 0; i <= ATTEMPTS_BEFORE_REFUSAL; i += 1) {
      await isSubscribeAttemptRefused(MOCK_TENANT_ID);
    }

    headersMock.mockResolvedValue(clientHeaders(MOCK_OTHER_CLIENT_IP));

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
    expect(headersMock).not.toHaveBeenCalled();
  });

  it('refuses and logs, without counting against the address, when BotID errors', async () => {
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard();
    checkBotIdMock.mockRejectedValue(MOCK_ERROR);

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(SUBSCRIBE_BLOCKED_EVENT, {
      reason: 'bot_check_unavailable',
      error: MOCK_ERROR,
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  it('refuses and logs when the rate-limit store errors', async () => {
    createRedisRateLimitStoreMock.mockReturnValue({
      increment: vi.fn().mockRejectedValue(MOCK_ERROR),
    });
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard({
      withKvStore: true,
    });

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(SUBSCRIBE_BLOCKED_EVENT, {
      reason: 'rate_limit_store_unavailable',
      error: MOCK_ERROR,
    });
  });

  it('refuses and logs when the rate-limit store cannot be configured', async () => {
    createRedisRateLimitStoreMock.mockImplementation(() => {
      throw MOCK_ERROR;
    });
    const { isSubscribeAttemptRefused, warnMock } = await loadGuard({
      withKvStore: true,
    });

    await expect(isSubscribeAttemptRefused(MOCK_TENANT_ID)).resolves.toBe(true);
    expect(warnMock).toHaveBeenCalledWith(SUBSCRIBE_BLOCKED_EVENT, {
      reason: 'rate_limit_store_unavailable',
      error: MOCK_ERROR,
    });
  });

  it('refuses when the store does not answer in time', async () => {
    createRedisRateLimitStoreMock.mockReturnValue({
      increment: vi.fn(() => new Promise<number>(() => {})),
    });
    const { isSubscribeAttemptRefused } = await loadGuard({
      withKvStore: true,
    });

    const refused = isSubscribeAttemptRefused(MOCK_TENANT_ID);
    await vi.advanceTimersByTimeAsync(STORE_TIMEOUT_MS);

    await expect(refused).resolves.toBe(true);
  });
});
