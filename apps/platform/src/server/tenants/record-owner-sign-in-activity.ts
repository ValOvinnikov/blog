import 'server-only';

import { queries } from '@blog/db';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';

const touchAndWakeTenant = async (tenantId: string, at: Date) => {
  try {
    await queries.tenants.touchTenantActivity(tenantId, at);
    const woken = await queries.tenants.wakeTenantFromInactivity(tenantId);
    if (woken) {
      await revalidateSiteConfig(tenantId);
    }
  } catch (error) {
    logger.error('tenant.sign_in_activity_failed', { tenantId, error });
  }
};

export const recordOwnerSignInActivity = async (
  userId: string,
): Promise<void> => {
  try {
    const memberships =
      await queries.memberships.listMembershipsWithTenantsForUser(userId);
    const at = new Date();

    await Promise.all(
      memberships
        .filter(({ membership }) => isTenantOwner(membership))
        .map(({ tenant }) => touchAndWakeTenant(tenant.id, at)),
    );
  } catch (error) {
    logger.error('tenant.sign_in_owner_lookup_failed', { userId, error });
  }
};
