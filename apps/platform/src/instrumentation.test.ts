import { faker } from '@faker-js/faker';
import { REQUEST_LOG } from '@platform/constants/request';
import { MOCK_LOKI_ENV } from '@platform/testing/env/fixtures';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  MOCK_RENDER_ROUTE_PATH,
  mockErrorContext,
  mockErrorRequest,
} from '@platform/testing/request-errors/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { registerLogSink } from '@shinefold/insight';
import { MOCK_SHORT_KEY } from '@shinefold/utils/encryption/encryption-fixtures';
import { waitUntil } from '@vercel/functions';

import { onRequestError, register } from './instrumentation';

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@shinefold/insight', () => ({
  createLokiSink: vi.fn(() => vi.fn()),
  registerLogSink: vi.fn(),
}));
const { ENV_MODULE } = vi.hoisted(() => ({
  ENV_MODULE: '@platform/utils/env/env',
}));

vi.mock(ENV_MODULE);

faker.seed(5744);

describe(register, () => {
  beforeEach(() => {
    Object.assign(env, MOCK_LOKI_ENV);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ships logs in the Node.js runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(registerLogSink).toHaveBeenCalledOnce();
  });

  it('registers nothing in the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(registerLogSink).not.toHaveBeenCalled();
  });
});

describe(onRequestError, () => {
  it('holds the function open for the whole log before the first await', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);
    const request = mockErrorRequest();
    const context = mockErrorContext();

    const handled = onRequestError(error, request, context);

    expect(waitUntil).toHaveBeenCalledExactlyOnceWith(handled);
    expect(logger.error).not.toHaveBeenCalled();

    await handled;

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      REQUEST_LOG.UNHANDLED_ERROR,
      {
        error,
        routePath: MOCK_RENDER_ROUTE_PATH,
        routeType: context.routeType,
        method: request.method,
        path: request.path,
      },
    );
  });
});

describe('register with the real env module', () => {
  beforeEach(() => {
    vi.doUnmock(ENV_MODULE);
    vi.doMock(
      '@platform/server/log-shipping/register-loki-sink/register-loki-sink',
      () => ({ registerLokiSink: vi.fn() }),
    );
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    vi.stubEnv('AUTH_SECRET', faker.string.alphanumeric(24));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts when every env value is valid', async () => {
    await expect(register()).resolves.toBeUndefined();
  });

  it('fails to start on a malformed env value without the log sink reading it', async () => {
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', MOCK_SHORT_KEY);

    await expect(register()).rejects.toThrow();
  });
});
