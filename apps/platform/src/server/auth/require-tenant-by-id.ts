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
 * The platform-operator counterpart to `requireTenantMembership`, gating
 * `/tenants/{id}/*` for any admin regardless of tenant membership. Resolves
 * archived tenants too (`includeArchived: true`) — only a genuinely unknown
 * id 404s — and is `cache()`-wrapped so the layout and its descendant pages
 * share one fetch.
 */
export const requireTenantById = cache(
  async (tenantId: string): Promise<TTenantByIdContext> => {
    // Settled, not `Promise.all`: a malformed id rejects the tenant read, and
    // the gate's redirect or 404 must still win over that error.
    const [adminResult, tenantResult] = await Promise.allSettled([
      requireAdmin(),
      queries.tenants.getTenantById(tenantId, { includeArchived: true }),
    ]);

    if (adminResult.status === 'rejected') {
      throw adminResult.reason;
    }

    if (tenantResult.status === 'rejected') {
      throw tenantResult.reason;
    }

    const tenant = tenantResult.value;

    if (!tenant) {
      notFound();
    }

    return { tenant, admin: adminResult.value };
  },
);
