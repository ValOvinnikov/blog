import 'server-only';

import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TTenant } from '@blog/db/schema/tenants';
import { notFound } from 'next/navigation';

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
 * tenant row 404s.
 */
export const requireTenantById = async (
  tenantId: string,
): Promise<TTenantByIdContext> => {
  const admin = await requireAdmin();
  const tenant = await queries.tenants.getTenantById(tenantId);

  if (!tenant) {
    notFound();
  }

  return { tenant, admin };
};
