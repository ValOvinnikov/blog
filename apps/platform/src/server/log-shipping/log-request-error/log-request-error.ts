import { logger } from '@platform/utils/logger/logger';
import type { Instrumentation } from 'next';

export const logRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  logger.error('request.unhandled_error', {
    error,
    routePath: context.routePath,
    routeType: context.routeType,
    method: request.method,
    path: new URL(request.path, 'http://localhost').pathname,
  });
};
