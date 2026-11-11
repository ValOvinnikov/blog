import { errorResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { REQUEST_LOG } from '@web/constants/request';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  MOCK_RENDER_ROUTE_PATH,
  mockErrorContext,
  mockErrorRequest,
} from '@web/testing/server/request-errors/fixtures';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { logger } from '@web/utils/logger/logger';

import { logRequestError } from './log-request-error';

faker.seed(6010);

const MOCK_ROUTE_PATH = `/api/${faker.lorem.word()}/callback`;
const MOCK_LOG_EVENT = `${faker.lorem.word()}.${faker.lorem.word()}`;
const MOCK_QUERY_STRING = `?code=${faker.string.alphanumeric(8)}&token=${faker.string.alphanumeric(16)}`;

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);

    await logRequestError(error, mockErrorRequest(), mockErrorContext());

    expect(logger.error).toHaveBeenCalledOnce();
    const [event, context] = vi.mocked(logger.error).mock.calls[0] ?? [];
    expect(event).toBe(REQUEST_LOG.UNHANDLED_ERROR);
    expect(context?.error).toBe(error);
    expect(context?.routePath).toBe(MOCK_RENDER_ROUTE_PATH);
  });

  it('logs the path without its query string', async () => {
    await logRequestError(
      new Error(MOCK_RENDER_ERROR_MESSAGE),
      mockErrorRequest({ path: `${MOCK_ROUTE_PATH}${MOCK_QUERY_STRING}` }),
      mockErrorContext({
        routePath: MOCK_ROUTE_PATH,
        routeType: 'route',
        renderSource: undefined,
      }),
    );

    const [, context] = vi.mocked(logger.error).mock.calls[0] ?? [];
    expect(context?.path).toBe(MOCK_ROUTE_PATH);
  });

  it('logs a failed page load once, through the guard, not again here', async () => {
    const result = errorResult(new Error(MOCK_RENDER_ERROR_MESSAGE));
    let thrown: unknown;
    try {
      guardPageLoaderResult(result, MOCK_LOG_EVENT);
    } catch (error) {
      thrown = error;
    }

    await logRequestError(thrown, mockErrorRequest(), mockErrorContext());

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(MOCK_LOG_EVENT, {
      error: result.error,
    });
  });
});
