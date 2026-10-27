import { faker } from '@faker-js/faker';
import { REQUEST_LOG } from '@platform/constants/request';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  MOCK_RENDER_ROUTE_PATH,
  mockErrorContext,
  mockErrorRequest,
} from '@platform/testing/request-errors/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { logRequestError } from './log-request-error';

faker.seed(6101);

const MOCK_CALLBACK_PATH = `/${faker.lorem.slug()}`;
const MOCK_QUERY_STRING = `?code=${faker.string.alphanumeric(8)}&token=${faker.string.alphanumeric(16)}`;

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);
    const request = mockErrorRequest();
    const context = mockErrorContext();

    await logRequestError(error, request, context);

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(REQUEST_LOG.UNHANDLED_ERROR, {
      error,
      routePath: MOCK_RENDER_ROUTE_PATH,
      routeType: context.routeType,
      method: request.method,
      path: request.path,
    });
  });

  it('logs the path without its query string', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);
    const request = mockErrorRequest({
      path: `${MOCK_CALLBACK_PATH}${MOCK_QUERY_STRING}`,
    });
    const context = mockErrorContext({ routePath: MOCK_CALLBACK_PATH });

    await logRequestError(error, request, context);

    expect(logger.error).toHaveBeenCalledWith(REQUEST_LOG.UNHANDLED_ERROR, {
      error,
      routePath: MOCK_CALLBACK_PATH,
      routeType: context.routeType,
      method: request.method,
      path: MOCK_CALLBACK_PATH,
    });
  });
});
