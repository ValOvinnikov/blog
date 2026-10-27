import { createLokiSink, LOG_LEVEL, registerLogSink } from '@blog/insight';
import { faker } from '@faker-js/faker';
import { waitUntil } from '@vercel/functions';
import { env } from '@worker/utils/env/__mocks__/env';

import { registerLokiSink } from './register-loki-sink';

faker.seed(7015);

vi.mock(import('@blog/insight'), async (importOriginal) => ({
  ...(await importOriginal()),
  createLokiSink: vi.fn(),
  registerLogSink: vi.fn(),
}));
vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@worker/utils/env/env');

const MOCK_VALID_ENV = {
  LOKI_PUSH_URL: faker.internet.url({ protocol: 'https' }),
  LOKI_USER: faker.string.numeric(6),
  LOKI_TOKEN: faker.string.alphanumeric(24),
};
const MOCK_LOG_EVENT = faker.lorem.word();

describe(registerLokiSink, () => {
  const push = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.mocked(createLokiSink).mockReturnValue(push);
    for (const key of Object.keys(env)) delete env[key];
    Object.assign(env, MOCK_VALID_ENV);
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
      env[key] = undefined;

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it.each(['[SENSITIVE]', 'not a url', 'ftp://logs.example.com'])(
    'registers nothing when the push URL is %s',
    (url) => {
      env.LOKI_PUSH_URL = url;

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
    const line = { level: LOG_LEVEL.ERROR, event: MOCK_LOG_EVENT };

    sink?.(line);

    expect(push).toHaveBeenCalledWith(line);
    expect(waitUntil).toHaveBeenCalledWith(push.mock.results[0]?.value);
  });
});
