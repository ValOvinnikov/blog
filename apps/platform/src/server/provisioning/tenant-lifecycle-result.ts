import type { ACTION_OUTCOME, TActionResult } from '@blog/config';
import type { TENANT_REFUSAL } from '@platform/constants/tenant';

import type {
  TConfirmTenantField,
  TConfirmTenantFieldError,
} from './resolve-confirmed-tenant';

export type TTenantLifecycleRefusal =
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.ALREADY_DEPROVISIONED
  | typeof TENANT_REFUSAL.NOT_DEPROVISIONED
  | typeof TENANT_REFUSAL.ALREADY_IN_PROGRESS
  | typeof TENANT_REFUSAL.NOT_ARCHIVED;

export type TTenantLifecycleResult<
  TRefusalReason extends TTenantLifecycleRefusal,
> = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  TConfirmTenantField,
  TConfirmTenantFieldError,
  TRefusalReason
>;
