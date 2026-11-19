import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { decryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { eq } from 'drizzle-orm';

export type TTenantSanityManagementCredentials = {
  projectId: string;
  token: string;
  managementRobotId: TMaybeNull<string>;
};

export async function getTenantSanityManagementCredentials(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantSanityManagementCredentials>> {
  const db = getDb();

  const [tenant] = await db
    .select({
      projectId: tenants.sanityProjectId,
      tokenEncrypted: tenants.sanityManagementTokenEncrypted,
      managementRobotId: tenants.sanityManagementRobotId,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant?.projectId || !tenant.tokenEncrypted) return undefined;

  return {
    projectId: tenant.projectId,
    token: decryptTenantSecret(tenant.tokenEncrypted),
    managementRobotId: tenant.managementRobotId,
  };
}
