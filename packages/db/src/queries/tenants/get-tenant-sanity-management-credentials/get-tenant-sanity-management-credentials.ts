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

  if (!tenant) return undefined;

  const { projectId, tokenEncrypted, managementRobotId } = tenant;

  if (!projectId || !tokenEncrypted) return undefined;

  return {
    projectId,
    token: decryptTenantSecret(tokenEncrypted),
    managementRobotId,
  };
}
