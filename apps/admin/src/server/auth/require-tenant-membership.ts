import 'server-only';

import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { notFound, redirect } from 'next/navigation';

import { auth } from './auth';

export type TTenantMembershipContext = {
  tenant: TTenant;
  membership: TMembership;
};

/**
 * The Tenant-section gate: no session redirects to sign-in, an unknown
 * tenant slug 404s, and a session with no `memberships` row for that tenant
 * redirects to `/unauthorized`. Deliberately independent of `requireAdmin` —
 * an `admins` row grants no access here, and vice versa. Called from a
 * layout (not a page) so every route nested under a gated tenant segment is
 * protected by existing there, never by a per-page check someone could
 * forget to add.
 */
export async function requireTenantMembership(
  tenantSlug: string,
): Promise<TTenantMembershipContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/api/auth/signin');
  }

  const tenant = await queries.tenants.getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const membership = await queries.memberships.getMembership(userId, tenant.id);

  if (!membership) {
    redirect('/unauthorized');
  }

  return { tenant, membership };
}
