import { logger } from '@web/utils/logger/logger';

import { logRequestError } from './log-request-error';

vi.mock('@web/utils/logger/logger');

describe(logRequestError, () => {
  it('logs one error-level line carrying the route', async () => {
    const error = new Error('render failed');

    await logRequestError(
      error,
      { path: '/blog/hello', method: 'GET', headers: {} },
      {
        routerKind: 'App Router',
        routePath: '/[tenant]/[locale]/blog/[slug]',
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
        routePath: '/[tenant]/[locale]/blog/[slug]',
      }),
    );
  });
});
