import 'server-only';

import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';

/**
 * A virtual, OWNER-level `TMembership` for an `admins` row acting on a
 * tenant it holds no real `memberships` row for. `id` is deliberately not a
 * UUID — nothing in this app persists a resolved `membership.id`/`userId`
 * as a foreign key (audit events resolve their actor from the session
 * directly), but the unmistakable shape keeps it that way if a future
 * consumer forgets.
 */
export const buildVirtualAdminMembership = (
  userId: string,
  tenantId: string,
): TMembership => ({
  id: `admin-virtual:${tenantId}`,
  userId,
  tenantId,
  role: MEMBERSHIP_ROLE.OWNER,
  createdAt: new Date(0),
});

/**
 * `buildVirtualAdminMembership`'s virtual `id` is the correct authorization
 * answer everywhere it's checked, but it is never a correct identity label —
 * a caller that displays `membership.role` to the signed-in user (e.g. a
 * role chip) must check this first, or a platform SUPERADMIN gets shown as
 * the tenant's OWNER.
 */
export const isVirtualAdminMembership = (membership: TMembership): boolean =>
  membership.id.startsWith('admin-virtual:');
