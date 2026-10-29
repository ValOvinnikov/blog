import type { TValueOf } from '@blog/config/utils';

export const TENANT_SORT_COLUMN = {
  NAME: 'NAME',
  PLAN: 'PLAN',
  STATUS: 'STATUS',
  CREATED: 'CREATED',
} as const;

export type TTenantSortColumn = TValueOf<typeof TENANT_SORT_COLUMN>;
