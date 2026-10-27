import { createLokiSink, registerLogSink } from '@blog/insight';
import { faker } from '@faker-js/faker';
import { env } from '@platform/utils/env/env';
import { waitUntil } from '@vercel/functions';

import { registerLokiSink } from './register-loki-sink';

faker.seed(6102);

vi.mock('@blog/insight', () => ({
  createLokiSink: vi.fn(),
  registerLogSink: vi.fn(),
}));
vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@platform/utils/env/env');

const MOCK_LOKI_ENV = {
  LOKI_PUSH_URL: faker.internet.url({ appendSlash: false }),
  LOKI_USER: faker.string.numeric(6),
  LOKI_TOKEN: faker.string.alphanumeric(24),
};
const MOCK_UNUSABLE_PUSH_URLS = [
  '[SENSITIVE]',
  faker.lorem.words(3),
  `ftp://${faker.internet.domainName()}`,
];
const MOCK_LOG_LINE = { event: faker.lorem.word() };

describe(registerLokiSink, () => {
  const push = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.mocked(createLokiSink).mockReturnValue(push);
    Object.assign(env, MOCK_LOKI_ENV);
  });

  it('registers a sink when all three variables are set', () => {
    expect(registerLokiSink()).toBe(true);

    expect(createLokiSink).toHaveBeenCalledWith({
      url: MOCK_LOKI_ENV.LOKI_PUSH_URL,
      user: MOCK_LOKI_ENV.LOKI_USER,
      token: MOCK_LOKI_ENV.LOKI_TOKEN,
    });
    expect(registerLogSink).toHaveBeenCalledOnce();
  });

  it.each(['LOKI_PUSH_URL', 'LOKI_USER', 'LOKI_TOKEN'])(
    'registers nothing when %s is unset',
    (key) => {
      Object.assign(env, { [key]: undefined });

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it.each(MOCK_UNUSABLE_PUSH_URLS)(
    'registers nothing when the push URL is %s',
    (url) => {
      Object.assign(env, { LOKI_PUSH_URL: url });

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it('registers nothing when the credentials cannot be encoded', () => {
    vi.mocked(createLokiSink).mockReturnValue(undefined);

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
