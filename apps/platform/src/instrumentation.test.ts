import { onPersonalDataFallback } from '@blog/db';
import { registerLogSink } from '@blog/insight';
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
import { waitUntil } from '@vercel/functions';

import { onRequestError, register } from './instrumentation';

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@blog/insight', () => ({
  createLokiSink: vi.fn(() => vi.fn()),
  registerLogSink: vi.fn(),
}));
vi.mock('@blog/db', () => ({ onPersonalDataFallback: vi.fn() }));
vi.mock('@platform/utils/env/env');

describe(register, () => {
  beforeEach(() => {
    Object.assign(env, MOCK_LOKI_ENV);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ships logs and watches personal-data fallbacks in the Node.js runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(registerLogSink).toHaveBeenCalledOnce();
    expect(onPersonalDataFallback).toHaveBeenCalledOnce();
  });

  it('registers nothing in the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(registerLogSink).not.toHaveBeenCalled();
    expect(onPersonalDataFallback).not.toHaveBeenCalled();
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
