import 'server-only';

import { queries } from '@blog/db';
import { TENANT_LOG } from '@platform/constants/tenant';
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
    logger.error(TENANT_LOG.SIGN_IN_ACTIVITY_FAILED, { tenantId, error });
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
    logger.error(TENANT_LOG.SIGN_IN_OWNER_LOOKUP_FAILED, { userId, error });
  }
};
