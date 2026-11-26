import { faker } from '@faker-js/faker';
import { MOCK_SHORT_KEY } from '@shinefold/utils/encryption/encryption-fixtures';
import { waitUntil } from '@vercel/functions';
import { logRequestError } from '@web/server/log-shipping/log-request-error/log-request-error';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  mockErrorContext,
  mockErrorRequest,
} from '@web/testing/server/request-errors/fixtures';

import { onRequestError, register } from './instrumentation';

vi.mock('@web/server/log-shipping/log-request-error/log-request-error', () => ({
  logRequestError: vi.fn(),
}));
vi.mock(
  '@web/server/log-shipping/register-loki-sink/register-loki-sink',
  () => ({
    registerLokiSink: vi.fn(),
  }),
);

faker.seed(5744);

describe(register, () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', faker.string.alphanumeric(8));
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', faker.lorem.word());
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

describe(onRequestError, () => {
  it('holds the function open for the whole log before the first await', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);
    const request = mockErrorRequest();
    const context = mockErrorContext();

    const handled = onRequestError(error, request, context);

    expect(waitUntil).toHaveBeenCalledOnce();
    expect(waitUntil).toHaveBeenCalledWith(handled);
    expect(logRequestError).not.toHaveBeenCalled();

    await handled;

    expect(logRequestError).toHaveBeenCalledWith(error, request, context);
  });
});
