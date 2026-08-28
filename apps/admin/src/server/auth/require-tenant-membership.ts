import 'server-only';

import { adminRoutes } from '@admin/utils/routes/routes';
import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { notFound, redirect } from 'next/navigation';

import { auth } from './auth';
import { buildVirtualAdminMembership } from './build-virtual-admin-membership';

export type TTenantMembershipContext = {
  tenant: TTenant;
  membership: TMembership;
};

/**
 * The Tenant-section gate: no session redirects to sign-in; an unknown
 * tenant slug and a session with no `memberships` row for a real tenant both
 * 404, indistinguishably — unless the session has any `admins` row, which
 * gets a virtual OWNER-level membership on any existing tenant instead,
 * regardless of any real `memberships` row or admin role. This matches
 * `requireAdmin`'s own floor: any admin role can reverse an in-app-state
 * edit. Called from a layout (not a page) so every route nested under a
 * gated tenant segment is protected by existing there, never by a per-page
 * check someone could forget to add.
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

  const admin = await queries.admins.getAdminByUserId(userId);

  if (admin) {
    return {
      tenant,
      membership: buildVirtualAdminMembership(userId, tenant.id),
    };
  }

  const membership = await queries.memberships.getMembership(userId, tenant.id);

  if (!membership) {
    notFound();
  }

  return { tenant, membership };
};
