'use client';

import type {
  TTenantLifecycleErrorReason,
  TTenantLifecycleResult,
} from '@platform/server/provisioning/tenant-lifecycle-result';
import { useTranslations } from 'next-intl';

export const useTenantLifecycleAction = <
  TArgs extends unknown[],
  TReason extends TTenantLifecycleErrorReason,
>(
  action: (...args: TArgs) => Promise<TTenantLifecycleResult<TReason>>,
) => {
  const t = useTranslations('tenantLifecycleErrors');

  return async (...args: TArgs) => {
    const result = await action(...args);
    if (result.ok) return result;
    const reason: TTenantLifecycleErrorReason = result.reason;
    return { ok: false as const, error: t(reason) };
  };
};
