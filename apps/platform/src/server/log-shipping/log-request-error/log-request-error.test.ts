import { logger } from '@platform/utils/logger/logger';

import { logRequestError } from './log-request-error';

vi.mock('@platform/utils/logger/logger');

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error('render failed');

    await logRequestError(
      error,
      { path: '/en/tenants/t_1/voice', method: 'GET', headers: {} },
      {
        routerKind: 'App Router',
        routePath: '/[locale]/tenants/[tenantId]/voice',
        routeType: 'render',
        renderSource: 'react-server-components',
        revalidateReason: undefined,
      },
    );

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'request.unhandled_error',
      expect.objectContaining({
        error,
        routePath: '/[locale]/tenants/[tenantId]/voice',
      }),
    );
  });

  it('logs the path without its query string', async () => {
    await logRequestError(
      new Error('render failed'),
      {
        path: '/api/auth/callback?code=abc&token=secret',
        method: 'GET',
        headers: {},
      },
      {
        routerKind: 'App Router',
        routePath: '/api/auth/callback',
        routeType: 'route',
        renderSource: undefined,
        revalidateReason: undefined,
      },
    );

    expect(logger.error).toHaveBeenCalledWith(
      'request.unhandled_error',
      expect.objectContaining({ path: '/api/auth/callback' }),
    );
  });
});
