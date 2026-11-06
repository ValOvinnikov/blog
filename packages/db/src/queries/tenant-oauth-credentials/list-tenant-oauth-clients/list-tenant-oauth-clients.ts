import { getDb } from '@blog/db/client';
import {
  tenantOAuthCredentials,
  type TTenantOAuthCredentials,
} from '@blog/db/schema/tenant-oauth-credentials';
import { asc, eq } from 'drizzle-orm';

export type TTenantOAuthClient = Pick<
  TTenantOAuthCredentials,
  'provider' | 'clientId' | 'updatedAt'
>;

export async function listTenantOAuthClients(
  tenantId: string,
): Promise<TTenantOAuthClient[]> {
  return getDb()
    .select({
      provider: tenantOAuthCredentials.provider,
      clientId: tenantOAuthCredentials.clientId,
      updatedAt: tenantOAuthCredentials.updatedAt,
    })
    .from(tenantOAuthCredentials)
    .where(eq(tenantOAuthCredentials.tenantId, tenantId))
    .orderBy(asc(tenantOAuthCredentials.provider));
}
