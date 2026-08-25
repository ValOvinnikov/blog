import 'server-only';

import { adminRoutes } from '@admin/utils/routes/routes';
import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { notFound, redirect } from 'next/navigation';

import { auth } from './auth';
import { buildSuperAdminMembership } from './build-super-admin-membership';
import { isSuperAdmin } from './is-super-admin';

export type TTenantMembershipContext = {
  tenant: TTenant;
  membership: TMembership;
};

/**
 * The Tenant-section gate: no session redirects to sign-in, an unknown
 * tenant slug 404s, and a session with no `memberships` row for that tenant
 * redirects to `/unauthorized` — unless the session is a platform
 * SUPERADMIN, who gets a virtual OWNER-level membership on any existing
 * tenant instead, regardless of any real `memberships` row. ADMIN/MODERATOR
 * `admins` rows still grant no access here. Called from a layout (not a
 * page) so every route nested under a gated tenant segment is protected by
 * existing there, never by a per-page check someone could forget to add.
 */
export const requireTenantMembership = async (
  tenantSlug: string,
): Promise<TTenantMembershipContext> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(adminRoutes.signIn());
  }

  const tenant = await queries.tenants.getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  if (await isSuperAdmin(userId)) {
    return { tenant, membership: buildSuperAdminMembership(userId, tenant.id) };
  }

  const membership = await queries.memberships.getMembership(userId, tenant.id);

  if (!membership) {
    redirect(adminRoutes.unauthorized());
  }

  return { tenant, membership };
};
