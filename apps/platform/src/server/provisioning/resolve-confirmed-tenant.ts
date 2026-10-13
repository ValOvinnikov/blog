import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { z } from 'zod';

import type { TTenantLifecycleErrorReason } from './tenant-lifecycle-result';

export const confirmTenantInputSchema = z.object({
  confirm: z.string().trim().min(1),
});

type TResolveConfirmedTenantOptions<
  TPreconditionReason extends TTenantLifecycleErrorReason,
> = {
  precondition?: (tenant: TTenant) => TMaybeUndefined<TPreconditionReason>;
};

export type TResolveConfirmedTenantResult<
  TPreconditionReason extends TTenantLifecycleErrorReason,
> =
  | { ok: true; tenant: TTenant }
  | { ok: false; reason: 'notFound' | 'nameMismatch' | TPreconditionReason };

export const resolveConfirmedTenant = async <
  TPreconditionReason extends TTenantLifecycleErrorReason = never,
>(
  tenantId: string,
  confirm: string,
  { precondition }: TResolveConfirmedTenantOptions<TPreconditionReason> = {},
): Promise<TResolveConfirmedTenantResult<TPreconditionReason>> => {
  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return { ok: false, reason: 'notFound' };
  }

  const preconditionReason = precondition?.(tenant);
  if (preconditionReason) {
    return { ok: false, reason: preconditionReason };
  }

  if (confirm !== tenant.name) {
    return { ok: false, reason: 'nameMismatch' };
  }

  return { ok: true, tenant };
};
