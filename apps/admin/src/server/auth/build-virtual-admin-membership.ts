import 'server-only';

import { MEMBERSHIP_ROLE } from '@blog/db';
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
