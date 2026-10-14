import 'server-only';

import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';

const VIRTUAL_ADMIN_MEMBERSHIP_ID_PREFIX = 'admin-virtual:';

/** An OWNER-level membership for an `admins` row on a tenant it has no `memberships` row for; its `id` is deliberately not a UUID, so it can never pass as a foreign key. */
export const buildVirtualAdminMembership = (
  userId: string,
  tenantId: string,
): TMembership => ({
  id: `${VIRTUAL_ADMIN_MEMBERSHIP_ID_PREFIX}${tenantId}`,
  userId,
  tenantId,
  role: MEMBERSHIP_ROLE.OWNER,
  createdAt: new Date(0),
});

/** Check before displaying `membership.role`: a virtual membership would show a SUPERADMIN as the tenant's OWNER. */
export const isVirtualAdminMembership = (membership: TMembership): boolean =>
  membership.id.startsWith(VIRTUAL_ADMIN_MEMBERSHIP_ID_PREFIX);
