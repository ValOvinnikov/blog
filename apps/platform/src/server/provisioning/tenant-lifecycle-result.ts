import type { ACTION_OUTCOME, TActionResult } from '@blog/config';
import type {
  TENANT_REFUSAL,
  TTenantFieldErrorReason,
  TTenantRefusal,
} from '@platform/constants/tenant';

import type { TConfirmTenantField } from './resolve-confirmed-tenant';

export type TTenantLifecycleRefusal = Exclude<
  TTenantRefusal,
  typeof TENANT_REFUSAL.ARCHIVED
>;

export type TTenantLifecycleResult<
  TRefusalReason extends TTenantLifecycleRefusal,
> = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  TConfirmTenantField,
  TTenantFieldErrorReason,
  TRefusalReason
>;
