import { HTTP_METHOD } from '@blog/config/constants';
import { REQUEST_LOG } from '@platform/constants/request';
import { logger } from '@platform/utils/logger/logger';

import { logRequestError } from './log-request-error';

const RENDER_ERROR_MESSAGE = 'render failed';
const APP_ROUTER = 'App Router';
const VOICE_ROUTE_PATH = '/[locale]/tenants/[tenantId]/voice';
const CALLBACK_PATH = '/api/auth/callback';

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error(RENDER_ERROR_MESSAGE);

    await logRequestError(
      error,
      { path: '/en/tenants/t_1/voice', method: HTTP_METHOD.GET, headers: {} },
      {
        routerKind: APP_ROUTER,
        routePath: VOICE_ROUTE_PATH,
        routeType: 'render',
        renderSource: 'react-server-components',
        revalidateReason: undefined,
      },
    );

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      REQUEST_LOG.UNHANDLED_ERROR,
      expect.objectContaining({
        error,
        routePath: VOICE_ROUTE_PATH,
      }),
    );
  });

  it('logs the path without its query string', async () => {
    await logRequestError(
      new Error(RENDER_ERROR_MESSAGE),
      {
        path: `${CALLBACK_PATH}?code=abc&token=secret`,
        method: HTTP_METHOD.GET,
        headers: {},
      },
      {
        routerKind: APP_ROUTER,
        routePath: CALLBACK_PATH,
        routeType: 'route',
        renderSource: undefined,
        revalidateReason: undefined,
      },
    );

    expect(logger.error).toHaveBeenCalledWith(
      REQUEST_LOG.UNHANDLED_ERROR,
      expect.objectContaining({ path: CALLBACK_PATH }),
    );
  });
});
