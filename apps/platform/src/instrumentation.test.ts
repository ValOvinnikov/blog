import { logRequestError } from '@platform/server/log-shipping/log-request-error/log-request-error';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  mockErrorContext,
  mockErrorRequest,
} from '@platform/testing/request-errors/fixtures';
import { waitUntil } from '@vercel/functions';

import { onRequestError } from './instrumentation';

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock(
  '@platform/server/log-shipping/log-request-error/log-request-error',
  () => ({ logRequestError: vi.fn() }),
);

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
