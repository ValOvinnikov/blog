import type { ACTION_OUTCOME, TActionResult } from '@blog/config';
import type {
  TTenantFieldErrorReason,
  TTenantRefusal,
} from '@platform/constants/tenant';

import type { TConfirmTenantField } from './resolve-confirmed-tenant';

export type TTenantLifecycleResult<TRefusalReason extends TTenantRefusal> =
  TActionResult<
    typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
    TConfirmTenantField,
    TTenantFieldErrorReason,
    TRefusalReason
  >;
