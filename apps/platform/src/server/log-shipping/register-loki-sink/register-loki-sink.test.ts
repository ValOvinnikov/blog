import type { TMaybeUndefined } from '@blog/config';
import { createLokiSink, registerLogSink } from '@blog/insight';
import { env } from '@platform/utils/env/env';
import { waitUntil } from '@vercel/functions';

import { registerLokiSink } from './register-loki-sink';

vi.mock('@blog/insight', () => ({
  createLokiSink: vi.fn(),
  registerLogSink: vi.fn(),
}));
vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@platform/utils/env/env', () => ({ env: {} }));

const VALID_ENV = {
  LOKI_PUSH_URL: 'https://logs.example.com/loki/api/v1/push',
  LOKI_USER: '123456',
  LOKI_TOKEN: 'glc_token',
};

const setEnv = (values: Record<string, TMaybeUndefined<string>>): void => {
  for (const key of Object.keys(env)) {
    delete (env as Record<string, unknown>)[key];
  }
  Object.assign(env, values);
};

describe(registerLokiSink, () => {
  const push = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.mocked(createLokiSink).mockReturnValue(push);
    setEnv(VALID_ENV);
  });

  it('registers a sink when all three variables are set', () => {
    expect(registerLokiSink()).toBe(true);

    expect(createLokiSink).toHaveBeenCalledWith({
      url: VALID_ENV.LOKI_PUSH_URL,
      user: VALID_ENV.LOKI_USER,
      token: VALID_ENV.LOKI_TOKEN,
    });
    expect(registerLogSink).toHaveBeenCalledOnce();
  });

  it.each(['LOKI_PUSH_URL', 'LOKI_USER', 'LOKI_TOKEN'])(
    'registers nothing when %s is unset',
    (key) => {
      setEnv({ ...VALID_ENV, [key]: undefined });

      expect(registerLokiSink()).toBe(false);
      expect(registerLogSink).not.toHaveBeenCalled();
    },
  );

  it.each(['[SENSITIVE]', 'not a url', 'ftp://logs.example.com'])(
    'registers nothing when the push URL is %s',
    (url) => {
      setEnv({ ...VALID_ENV, LOKI_PUSH_URL: url });

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
    const line = { level: 'error', event: 'x.failed' };

    sink?.(line);

    expect(push).toHaveBeenCalledWith(line);
    expect(waitUntil).toHaveBeenCalledWith(push.mock.results[0]?.value);
  });
});
