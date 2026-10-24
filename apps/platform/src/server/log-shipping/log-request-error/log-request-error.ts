import { REQUEST_LOG } from '@platform/constants/request';
import { logger } from '@platform/utils/logger/logger';
import type { Instrumentation } from 'next';

export const logRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  logger.error(REQUEST_LOG.UNHANDLED_ERROR, {
    error,
    routePath: context.routePath,
    routeType: context.routeType,
    method: request.method,
    path: new URL(request.path, 'http://localhost').pathname,
  });
};
