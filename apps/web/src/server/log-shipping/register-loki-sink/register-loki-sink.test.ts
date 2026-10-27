import { createLokiSink, registerLogSink } from '@blog/insight';
import { faker } from '@faker-js/faker';
import { waitUntil } from '@vercel/functions';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';

import { registerLokiSink } from './register-loki-sink';

faker.seed(6010);

vi.mock('@blog/insight', () => ({
  createLokiSink: vi.fn(),
  registerLogSink: vi.fn(),
}));
vi.mock('@web/utils/env/env', () => ({ env: {} }));

const MOCK_VALID_ENV = {
  LOKI_PUSH_URL: faker.internet.url({ protocol: 'https' }),
  LOKI_USER: faker.string.numeric(6),
  LOKI_TOKEN: faker.string.alphanumeric(24),
};
const MOCK_LOG_LINE = { event: faker.lorem.slug() };
const MOCK_MALFORMED_URL = faker.lorem.words(2);
const MOCK_NON_HTTP_URL = `ftp://${faker.internet.domainName()}`;

describe(registerLokiSink, () => {
  const push = vi.fn();

  beforeEach(() => {
    push.mockReset();
    push.mockResolvedValue(undefined);
    vi.mocked(createLokiSink).mockReturnValue(push);
    setMockEnv(MOCK_VALID_ENV);
  });

  it('registers a sink when all three variables are set', () => {
    expect(registerLokiSink()).toBe(true);

    expect(createLokiSink).toHaveBeenCalledWith({
      url: MOCK_VALID_ENV.LOKI_PUSH_URL,
      user: MOCK_VALID_ENV.LOKI_USER,
      token: MOCK_VALID_ENV.LOKI_TOKEN,
    });
    expect(registerLogSink).toHaveBeenCalledOnce();
  });

  it.each(['LOKI_PUSH_URL', 'LOKI_USER', 'LOKI_TOKEN'])(
    'registers nothing when %s is unset',
    (key) => {
      setMockEnv({ ...MOCK_VALID_ENV, [key]: undefined });

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it.each([MOCK_MALFORMED_URL, MOCK_NON_HTTP_URL])(
    'registers nothing when the push URL is %s',
    (url) => {
      setMockEnv({ ...MOCK_VALID_ENV, LOKI_PUSH_URL: url });

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it('registers nothing when the credentials cannot be encoded', () => {
    vi.mocked(createLokiSink).mockReturnValueOnce(undefined);

    expect(registerLokiSink()).toBe(false);
    expect(registerLogSink).not.toHaveBeenCalled();
  });

  it('hands each pushed line to waitUntil', () => {
    registerLokiSink();
    const sink = vi.mocked(registerLogSink).mock.calls[0]?.[0];

    sink?.(MOCK_LOG_LINE);

    expect(push).toHaveBeenCalledWith(MOCK_LOG_LINE);
    expect(waitUntil).toHaveBeenCalledWith(push.mock.results[0]?.value);
  });
});
