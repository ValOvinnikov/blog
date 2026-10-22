import { HTTP_METHOD } from '@blog/config/constants';
import { logger } from '@web/utils/logger/logger';

import { logRequestError } from './log-request-error';

const RENDER_FAILED = 'render failed';
const BLOG_ROUTE_PATH = '/[tenant]/[locale]/blog/[slug]';
const CALLBACK_PATH = '/api/auth/callback';
const APP_ROUTER = 'App Router';
const UNHANDLED_ERROR_EVENT = 'request.unhandled_error';

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error(RENDER_FAILED);

    await logRequestError(
      error,
      { path: '/blog/hello', method: HTTP_METHOD.GET, headers: {} },
      {
        routerKind: APP_ROUTER,
        routePath: BLOG_ROUTE_PATH,
        routeType: 'render',
        renderSource: 'react-server-components',
        revalidateReason: undefined,
      },
    );

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      UNHANDLED_ERROR_EVENT,
      expect.objectContaining({
        error,
        routePath: BLOG_ROUTE_PATH,
      }),
    );
  });

  it('logs the path without its query string', async () => {
    await logRequestError(
      new Error(RENDER_FAILED),
      {
        path: '/api/auth/callback?code=abc&token=secret',
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
      UNHANDLED_ERROR_EVENT,
      expect.objectContaining({ path: CALLBACK_PATH }),
    );
  });
});
