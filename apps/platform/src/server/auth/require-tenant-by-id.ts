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
 * The platform-operator counterpart to `requireTenantMembership`: the
 * `/tenants/{id}/*` tree is for operators acting on any tenant, unlike the
 * tenant's own `memberships`-gated section. `cache()`-wrapped because a
 * layout can't pass this down to its page, so the ancestor gate and the
 * `(detail)`/Studio pages below it would otherwise each resolve it separately.
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
