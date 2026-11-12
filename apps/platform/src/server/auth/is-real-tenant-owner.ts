import 'server-only';

import type { TMembership } from '@blog/db/schema/memberships';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';

/** The tenant's own OWNER, never an operator holding a virtual OWNER membership. */
export const isRealTenantOwner = (membership: TMembership): boolean =>
  isTenantOwner(membership) && !isVirtualAdminMembership(membership);
