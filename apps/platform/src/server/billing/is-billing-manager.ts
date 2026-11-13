import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import { isRealTenantOwner } from '@platform/server/auth/is-real-tenant-owner';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';

export const isBillingManager = (
  membership: TMembership,
  admin: TMaybeUndefined<TAdmin>,
): boolean => isRealTenantOwner(membership) || isSuperAdmin(admin);
