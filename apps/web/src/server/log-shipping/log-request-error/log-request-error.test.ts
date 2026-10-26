import { REQUEST_LOG } from '@web/constants/request';
import {
  MOCK_RENDER_ERROR_MESSAGE,
  MOCK_RENDER_ROUTE_PATH,
  mockErrorContext,
  mockErrorRequest,
} from '@web/testing/server/request-errors/fixtures';
import { logger } from '@web/utils/logger/logger';

import { logRequestError } from './log-request-error';

const CALLBACK_PATH = '/api/auth/callback';

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error(MOCK_RENDER_ERROR_MESSAGE);

    await logRequestError(error, mockErrorRequest(), mockErrorContext());

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      REQUEST_LOG.UNHANDLED_ERROR,
      expect.objectContaining({
        error,
        routePath: MOCK_RENDER_ROUTE_PATH,
      }),
    );
  });

  it('logs the path without its query string', async () => {
    await logRequestError(
      new Error(MOCK_RENDER_ERROR_MESSAGE),
      mockErrorRequest({ path: `${CALLBACK_PATH}?code=abc&token=secret` }),
      mockErrorContext({
        routePath: CALLBACK_PATH,
        routeType: 'route',
        renderSource: undefined,
      }),
    );

    expect(logger.error).toHaveBeenCalledWith(
      REQUEST_LOG.UNHANDLED_ERROR,
      expect.objectContaining({ path: CALLBACK_PATH }),
    );
  });
});
