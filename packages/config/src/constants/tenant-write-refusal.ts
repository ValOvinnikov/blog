import type { TValueOf } from '@blog/config/utils';

export const TENANT_WRITE_REFUSAL = {
  UNRESOLVED: 'UNRESOLVED',
  INACTIVE: 'INACTIVE',
} as const;

export type TTenantWriteRefusal = TValueOf<typeof TENANT_WRITE_REFUSAL>;
