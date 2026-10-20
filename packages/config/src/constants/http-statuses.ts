import type { TValueOf } from '@blog/config/utils';

export const HTTP_STATUS = { NOT_FOUND: 404, UNAUTHORIZED: 401 } as const;

export type THttpStatus = TValueOf<typeof HTTP_STATUS>;
