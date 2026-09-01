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
    const admin = await requireAdmin();
    const tenant = await queries.tenants.getTenantById(tenantId, {
      includeArchived: true,
    });

    if (!tenant) {
      notFound();
    }

    return { tenant, admin };
  },
);
