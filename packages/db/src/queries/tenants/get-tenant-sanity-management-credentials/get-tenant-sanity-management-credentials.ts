import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { decryptSecret } from '@shinefold/utils';
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
    token: decryptSecret(
      tenant.tokenEncrypted,
      requireTenantTokenEncryptionKey(),
    ),
    managementRobotId: tenant.managementRobotId,
  };
}
