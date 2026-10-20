'use client';

import { ACTION_OUTCOME, type TOutcome } from '@blog/config';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TConfirmTenantFieldError } from '@platform/server/provisioning/resolve-confirmed-tenant';
import type {
  TTenantLifecycleRefusal,
  TTenantLifecycleResult,
} from '@platform/server/provisioning/tenant-lifecycle-result';
import { useTranslations } from 'next-intl';

const FIELD_ERROR_KEYS = {
  [TENANT_FIELD_ERROR.CONFIRM_REQUIRED]: 'confirmRequired',
  [TENANT_FIELD_ERROR.NAME_MISMATCH]: 'nameMismatch',
} satisfies Record<TConfirmTenantFieldError, string>;

const REFUSAL_KEYS = {
  [TENANT_REFUSAL.NOT_FOUND]: 'notFound',
  [TENANT_REFUSAL.ARCHIVED]: 'archived',
  [TENANT_REFUSAL.ALREADY_DEPROVISIONED]: 'alreadyDeprovisioned',
  [TENANT_REFUSAL.NOT_DEPROVISIONED]: 'notDeprovisioned',
  [TENANT_REFUSAL.ALREADY_IN_PROGRESS]: 'alreadyInProgress',
  [TENANT_REFUSAL.NOT_ARCHIVED]: 'notArchived',
} satisfies Record<TTenantLifecycleRefusal, string>;

type TServerErrorKey =
  | 'deprovisionFailed'
  | 'reactivateFailed'
  | 'deleteFailed'
  | 'suspendFailed'
  | 'liftSuspensionFailed';

export const useTenantLifecycleAction = <
  TArgs extends unknown[],
  TRefusal extends TTenantLifecycleRefusal,
>(
  action: (...args: TArgs) => Promise<TTenantLifecycleResult<TRefusal>>,
  serverErrorKey: TServerErrorKey,
) => {
  const t = useTranslations('tenantLifecycleErrors');

  const errorKey = (
    result: Exclude<
      TTenantLifecycleResult<TRefusal>,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >,
  ) => {
    switch (result.outcome) {
      case ACTION_OUTCOME.INVALID:
        return FIELD_ERROR_KEYS[
          result.fieldErrors.confirm?.reason ??
            TENANT_FIELD_ERROR.CONFIRM_REQUIRED
        ];
      case ACTION_OUTCOME.REFUSED:
        return REFUSAL_KEYS[result.reason];
      case ACTION_OUTCOME.SERVER_ERROR:
        return serverErrorKey;
    }
  };

  return async (...args: TArgs) => {
    const result = await action(...args);
    if (result.outcome === ACTION_OUTCOME.SUCCESS) return { ok: true as const };
    return { ok: false as const, error: t(errorKey(result)) };
  };
};
