import 'server-only';

import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TTenant } from '@blog/db/schema/tenants';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { requireAdmin } from './require-admin';

export type TTenantByIdContext = {
  tenant: TTenant;
  admin: TAdmin;
};

/**
 * The platform-operator counterpart to `requireTenantMembership`: gated on
 * being in `admins` (via `requireAdmin`), not on a `memberships` row for the
 * routed tenant — the `/tenants/{id}/*` tree is for operators acting on any
 * tenant, unlike the tenant's own `memberships`-gated section. An id with no
 * tenant row 404s. Wrapped in `cache()` so the ancestor `[tenantId]` layout's
 * gating call and a page below it (`(detail)`'s chrome layout, or the
 * bare Studio page, which has no other channel to receive the resolved
 * tenant) share one fetch per request.
 */
export const requireTenantById = cache(
  async (tenantId: string): Promise<TTenantByIdContext> => {
    const admin = await requireAdmin();
    const tenant = await queries.tenants.getTenantById(tenantId);

    if (!tenant) {
      notFound();
    }

    return { tenant, admin };
  },
);
