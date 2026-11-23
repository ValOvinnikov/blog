import type { TENANT_REFUSAL } from '@platform/constants/tenant';
import type { ACTION_OUTCOME, TActionResult } from '@shinefold/config';

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
  | typeof TENANT_REFUSAL.DEPROVISION_UNDERWAY
  | typeof TENANT_REFUSAL.NOT_ARCHIVED
  | typeof TENANT_REFUSAL.NOT_SUSPENDED
  | typeof TENANT_REFUSAL.PLATFORM_TENANT
  | typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN
  | typeof TENANT_REFUSAL.SUBSCRIPTION_CANCEL_FAILED
  | typeof TENANT_REFUSAL.SUBSCRIPTION_LIVE;

export type TTenantLifecycleResult<
  TRefusalReason extends TTenantLifecycleRefusal,
> = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  TConfirmTenantField,
  TConfirmTenantFieldError,
  TRefusalReason
>;
