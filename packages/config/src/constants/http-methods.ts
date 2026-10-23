import type { TValueOf } from '@blog/config/utils';

export const HTTP_METHOD = {
  GET: 'GET',
  HEAD: 'HEAD',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type THttpMethod = TValueOf<typeof HTTP_METHOD>;
