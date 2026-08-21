import 'server-only';

import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { redirect } from 'next/navigation';

import { auth } from './auth';

export type TSessionTenants = {
  userId: string;
  memberships: TMembership[];
  tenants: TTenant[];
};

/**
 * The slug-free dashboard's shared first step: who's signed in, and every
 * tenant their `memberships` rows grant access to. Redirects to sign-in with
 * no session, or `/unauthorized` with zero memberships — the same two
 * outcomes `requireTenantMembership` and `requireAdmin` short-circuit on.
 * `resolveDashboardTenant` narrows this further to exactly one tenant; the
 * `/dashboard/select-tenant` picker page calls this directly since it needs
 * to render on the membership count itself, before any tenant is chosen.
 */
export const listSessionTenants = async (): Promise<TSessionTenants> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/api/auth/signin');
  }

  const memberships = await queries.memberships.listMembershipsForUser(userId);

  if (memberships.length === 0) {
    redirect('/unauthorized');
  }

  const tenants = await queries.tenants.listTenantsByIds(
    memberships.map((membership) => membership.tenantId),
  );

  return { userId, memberships, tenants };
};
