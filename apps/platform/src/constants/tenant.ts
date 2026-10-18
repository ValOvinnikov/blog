import type { TValueOf } from '@blog/config/utils';

export const TENANT_FIELD_ERROR = {
  CONFIRM_REQUIRED: 'CONFIRM_REQUIRED',
  NAME_MISMATCH: 'NAME_MISMATCH',
} as const;

export type TTenantFieldErrorReason = TValueOf<typeof TENANT_FIELD_ERROR>;

export const TENANT_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
  ARCHIVED: 'ARCHIVED',
  ALREADY_DEPROVISIONED: 'ALREADY_DEPROVISIONED',
  NOT_DEPROVISIONED: 'NOT_DEPROVISIONED',
  ALREADY_IN_PROGRESS: 'ALREADY_IN_PROGRESS',
  NOT_ARCHIVED: 'NOT_ARCHIVED',
} as const;

export type TTenantRefusal = TValueOf<typeof TENANT_REFUSAL>;
