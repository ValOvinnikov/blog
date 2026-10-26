import { HTTP_METHOD } from '@blog/config/constants';
import type { Instrumentation } from 'next';

type TRequestErrorArgs = Parameters<Instrumentation.onRequestError>;
type TErrorRequest = TRequestErrorArgs[1];
type TErrorContext = TRequestErrorArgs[2];

export const MOCK_RENDER_ERROR_MESSAGE = 'render failed';
export const MOCK_RENDER_ROUTE_PATH = '/[locale]/tenants/[tenantId]/voice';

export const mockErrorRequest = (
  overrides: Partial<TErrorRequest> = {},
): TErrorRequest => ({
  path: '/en/tenants/t_1/voice',
  method: HTTP_METHOD.GET,
  headers: {},
  ...overrides,
});

export const mockErrorContext = (
  overrides: Partial<TErrorContext> = {},
): TErrorContext => ({
  routerKind: 'App Router',
  routePath: MOCK_RENDER_ROUTE_PATH,
  routeType: 'render',
  renderSource: 'react-server-components',
  revalidateReason: undefined,
  ...overrides,
});
